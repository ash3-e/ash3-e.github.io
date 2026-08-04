using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading;
using System.Windows.Automation;
using System.Windows.Forms;

internal static class LainReplyBridge
{
    private static bool traceEnabled;

    private static void Trace(string value)
    {
        if (traceEnabled) Console.Error.WriteLine(value);
    }

    private delegate bool EnumWindowsProc(IntPtr window, IntPtr parameter);

    [DllImport("user32.dll")]
    private static extern bool EnumWindows(EnumWindowsProc callback, IntPtr parameter);

    [DllImport("user32.dll")]
    private static extern bool IsWindowVisible(IntPtr window);

    [DllImport("user32.dll")]
    private static extern uint GetWindowThreadProcessId(IntPtr window, out uint processId);

    [DllImport("user32.dll")]
    private static extern int GetWindowTextLength(IntPtr window);

    [DllImport("user32.dll", CharSet = CharSet.Unicode)]
    private static extern int GetWindowText(IntPtr window, StringBuilder text, int count);

    [DllImport("user32.dll")]
    private static extern bool GetWindowRect(IntPtr window, out NativeRect rect);

    [DllImport("user32.dll")]
    private static extern bool ShowWindowAsync(IntPtr window, int command);

    [DllImport("user32.dll")]
    private static extern bool SetForegroundWindow(IntPtr window);

    [DllImport("user32.dll")]
    private static extern bool BringWindowToTop(IntPtr window);

    [DllImport("user32.dll")]
    private static extern IntPtr GetForegroundWindow();

    [DllImport("user32.dll")]
    private static extern bool AttachThreadInput(uint source, uint target, bool attach);

    [DllImport("kernel32.dll")]
    private static extern uint GetCurrentThreadId();

    [DllImport("user32.dll")]
    private static extern void keybd_event(byte virtualKey, byte scanCode, uint flags, UIntPtr extraInfo);

    [StructLayout(LayoutKind.Sequential)]
    private struct NativeRect
    {
        public int Left;
        public int Top;
        public int Right;
        public int Bottom;
    }

    private sealed class WindowInfo
    {
        public IntPtr Handle;
        public string Title;
        public int Width;
        public int Height;
    }

    private sealed class TargetRoute
    {
        public WindowInfo Window;
        public AutomationElement Root;
        public AutomationElement Editor;
        public AutomationElement ReplyControl;
        public string Route;
    }

    private sealed class ComposerCandidate
    {
        public AutomationElement Element;
        public double Y;
    }

    private static bool NameEquals(string actual, string expected)
    {
        return string.Equals(actual ?? string.Empty, expected ?? string.Empty, StringComparison.OrdinalIgnoreCase);
    }

    private static bool IsOfficialProcessName(string processName)
    {
        return NameEquals(processName, "ChatGPT") || NameEquals(processName, "Codex");
    }

    private static bool IsMainWindowSize(NativeRect rect)
    {
        return rect.Right - rect.Left >= 600 && rect.Bottom - rect.Top >= 400;
    }

    private static int MainWindowTitlePriority(string title)
    {
        if (NameEquals(title, "ChatGPT")) return 0;
        if (NameEquals(title, "Codex")) return 1;
        return 2;
    }

    private static string DecodeBase64(string value)
    {
        return Encoding.UTF8.GetString(Convert.FromBase64String(value ?? string.Empty));
    }

    private static string JsonEscape(string value)
    {
        if (value == null) return "";
        var result = new StringBuilder(value.Length + 8);
        foreach (char character in value)
        {
            switch (character)
            {
                case '\\': result.Append("\\\\"); break;
                case '"': result.Append("\\\""); break;
                case '\b': result.Append("\\b"); break;
                case '\f': result.Append("\\f"); break;
                case '\n': result.Append("\\n"); break;
                case '\r': result.Append("\\r"); break;
                case '\t': result.Append("\\t"); break;
                default:
                    if (character < 32) result.Append("\\u" + ((int)character).ToString("x4"));
                    else result.Append(character);
                    break;
            }
        }
        return result.ToString();
    }

    private static int WriteResult(int exitCode, params object[] pairs)
    {
        var json = new StringBuilder("{");
        for (int index = 0; index + 1 < pairs.Length; index += 2)
        {
            if (index > 0) json.Append(',');
            json.Append('"').Append(JsonEscape(Convert.ToString(pairs[index]))).Append("\":");
            object value = pairs[index + 1];
            if (value is bool) json.Append(((bool)value) ? "true" : "false");
            else if (value is int || value is long) json.Append(Convert.ToString(value, System.Globalization.CultureInfo.InvariantCulture));
            else json.Append('"').Append(JsonEscape(Convert.ToString(value))).Append('"');
        }
        json.Append('}');
        Console.Out.WriteLine(json.ToString());
        Console.Out.Flush();
        Environment.Exit(exitCode);
        return exitCode;
    }

    private static HashSet<uint> GetOfficialProcessIds()
    {
        var ids = new HashSet<uint>();
        foreach (string processName in new[] { "ChatGPT", "Codex" })
        {
            foreach (Process process in Process.GetProcessesByName(processName))
            {
                using (process)
                {
                    if (IsOfficialProcessName(process.ProcessName)) ids.Add((uint)process.Id);
                }
            }
        }
        return ids;
    }

    private static List<WindowInfo> GetOfficialWindows(HashSet<uint> processIds, string testWindowTitle)
    {
        var windows = new List<WindowInfo>();
        EnumWindows(delegate(IntPtr window, IntPtr parameter)
        {
            if (!IsWindowVisible(window)) return true;
            uint processId;
            GetWindowThreadProcessId(window, out processId);

            int titleLength = GetWindowTextLength(window);
            var title = new StringBuilder(Math.Max(1, titleLength + 1));
            GetWindowText(window, title, title.Capacity);
            NativeRect rect;
            if (!GetWindowRect(window, out rect)) return true;
            if (!string.IsNullOrEmpty(testWindowTitle))
            {
                Trace("visible-window:" + title.ToString());
                if (!NameEquals(title.ToString(), testWindowTitle)) return true;
            }
            else
            {
                if (!processIds.Contains(processId)) return true;
                // Companion overlays and the built-in pet may share Codex's
                // process family. Only a full-size desktop window is eligible.
                if (!IsMainWindowSize(rect)) return true;
            }
            windows.Add(new WindowInfo
            {
                Handle = window,
                Title = title.ToString(),
                Width = rect.Right - rect.Left,
                Height = rect.Bottom - rect.Top
            });
            return true;
        }, IntPtr.Zero);

        windows.Sort(delegate(WindowInfo left, WindowInfo right)
        {
            int leftPriority = MainWindowTitlePriority(left.Title);
            int rightPriority = MainWindowTitlePriority(right.Title);
            int priority = leftPriority.CompareTo(rightPriority);
            if (priority != 0) return priority;
            return (right.Width * right.Height).CompareTo(left.Width * left.Height);
        });
        return windows;
    }

    private static AutomationElement FindNamedControl(AutomationElement root, ControlType type, string name)
    {
        var condition = new AndCondition(
            new PropertyCondition(AutomationElement.ControlTypeProperty, type),
            new PropertyCondition(AutomationElement.NameProperty, name, PropertyConditionFlags.IgnoreCase)
        );
        return root.FindFirst(TreeScope.Descendants, condition);
    }

    private static AutomationElement FindMainComposer(AutomationElement root, string threadTitle)
    {
        AutomationElementCollection controls = root.FindAll(TreeScope.Descendants, Condition.TrueCondition);
        bool titleFound = false;
        var candidates = new List<ComposerCandidate>();
        System.Windows.Rect rootBounds = root.Current.BoundingRectangle;

        for (int index = 0; index < controls.Count; index++)
        {
            try
            {
                AutomationElement control = controls[index];
                if (NameEquals(control.Current.Name, threadTitle)) titleFound = true;
                if (control.Current.ControlType != ControlType.Edit || !control.Current.IsEnabled ||
                    !control.Current.IsKeyboardFocusable || control.Current.IsOffscreen) continue;

                System.Windows.Rect bounds = control.Current.BoundingRectangle;
                string name = control.Current.Name ?? string.Empty;
                string className = control.Current.ClassName ?? string.Empty;
                bool composerName = NameEquals(name, "Do anything") || NameEquals(name, "Ask anything") ||
                    NameEquals(name, "Message") || NameEquals(name, "Follow up");
                bool composerClass = NameEquals(className, "ProseMirror");
                bool nearBottom = bounds.Y >= rootBounds.Y + (rootBounds.Height * 0.55);
                bool practicalSize = bounds.Width >= 180 && bounds.Height >= 20 && bounds.Height <= 240;
                if ((composerName || composerClass) && nearBottom && practicalSize)
                {
                    candidates.Add(new ComposerCandidate { Element = control, Y = bounds.Y });
                }
            }
            catch { }
        }

        if (!titleFound || candidates.Count == 0) return null;
        candidates.Sort(delegate(ComposerCandidate left, ComposerCandidate right) { return right.Y.CompareTo(left.Y); });
        return candidates[0].Element;
    }

    private static bool InvokeReplyControl(AutomationElement control)
    {
        object pattern;
        if (control.TryGetCurrentPattern(TogglePattern.Pattern, out pattern))
        {
            ((TogglePattern)pattern).Toggle();
            return true;
        }
        if (control.TryGetCurrentPattern(InvokePattern.Pattern, out pattern))
        {
            ((InvokePattern)pattern).Invoke();
            return true;
        }
        return false;
    }

    private static bool SetTargetForeground(IntPtr window)
    {
        IntPtr foreground = GetForegroundWindow();
        uint foregroundProcessId;
        uint targetProcessId;
        uint foregroundThread = GetWindowThreadProcessId(foreground, out foregroundProcessId);
        uint targetThread = GetWindowThreadProcessId(window, out targetProcessId);
        uint currentThread = GetCurrentThreadId();
        bool attachedForeground = false;
        bool attachedTarget = false;

        try
        {
            if (foregroundThread != 0 && foregroundThread != currentThread)
                attachedForeground = AttachThreadInput(currentThread, foregroundThread, true);
            if (targetThread != 0 && targetThread != currentThread)
                attachedTarget = AttachThreadInput(currentThread, targetThread, true);

            ShowWindowAsync(window, 9);
            keybd_event(0x12, 0, 0, UIntPtr.Zero);
            BringWindowToTop(window);
            SetForegroundWindow(window);
            keybd_event(0x12, 0, 0x0002, UIntPtr.Zero);
        }
        finally
        {
            if (attachedTarget) AttachThreadInput(currentThread, targetThread, false);
            if (attachedForeground) AttachThreadInput(currentThread, foregroundThread, false);
        }

        for (int attempt = 0; attempt < 30; attempt++)
        {
            if (GetForegroundWindow() == window) return true;
            Thread.Sleep(50);
        }
        return false;
    }

    private static TargetRoute FindTarget(List<WindowInfo> windows, string threadTitle)
    {
        string editorName = "Follow up on " + threadTitle;
        string buttonName = "Reply to " + threadTitle;

        foreach (WindowInfo window in windows)
        {
            try
            {
                Trace("activity-window:" + window.Title);
                AutomationElement root = AutomationElement.FromHandle(window.Handle);
                Trace("activity-root");
                AutomationElement editor = FindNamedControl(root, ControlType.Edit, editorName);
                Trace("activity-editor:" + (editor != null));
                if (traceEnabled && editor == null)
                {
                    var editCondition = new PropertyCondition(AutomationElement.ControlTypeProperty, ControlType.Edit);
                    AutomationElementCollection edits = root.FindAll(TreeScope.Descendants, editCondition);
                    for (int editIndex = 0; editIndex < edits.Count; editIndex++)
                        Trace("activity-edit-name:" + edits[editIndex].Current.Name + ";class:" + edits[editIndex].Current.ClassName);
                }
                if (editor != null)
                    return new TargetRoute { Window = window, Root = root, Editor = editor, Route = "activity-editor" };

                AutomationElement button = FindNamedControl(root, ControlType.Button, buttonName);
                Trace("activity-button:" + (button != null));
                if (button != null)
                    return new TargetRoute { Window = window, Root = root, ReplyControl = button, Route = "activity-reply" };
            }
            catch { }
        }

        foreach (WindowInfo window in windows)
        {
            try
            {
                AutomationElement root = AutomationElement.FromHandle(window.Handle);
                AutomationElement editor = FindMainComposer(root, threadTitle);
                if (editor != null)
                    return new TargetRoute { Window = window, Root = root, Editor = editor, Route = "main-composer" };
            }
            catch { }
        }
        return null;
    }

    [STAThread]
    private static int Main(string[] args)
    {
        try
        {
            string titleBase64 = string.Empty;
            bool probe = false;
            bool focusOnly = false;
            uint testProcessId = 0;
            string testWindowTitle = string.Empty;
            for (int index = 0; index < args.Length; index++)
            {
                if (args[index] == "--probe") probe = true;
                else if (args[index] == "--focus-only") focusOnly = true;
                else if (args[index] == "--trace") traceEnabled = true;
                else if (args[index] == "--thread-title-base64" && index + 1 < args.Length) titleBase64 = args[++index];
                else if (args[index] == "--test-process-id" && index + 1 < args.Length) uint.TryParse(args[++index], out testProcessId);
                else if (args[index] == "--test-window-title-base64" && index + 1 < args.Length) testWindowTitle = DecodeBase64(args[++index]);
            }

            string threadTitle = DecodeBase64(titleBase64).Trim();
            Trace("args-ready");
            if (!focusOnly && threadTitle.Length == 0)
                return WriteResult(2, "ok", false, "message", "THE ACTIVE TASK TITLE IS NOT AVAILABLE");

            string text = (probe || focusOnly) ? string.Empty : Console.In.ReadToEnd().Trim();
            if (!probe && !focusOnly && text.Length == 0)
                return WriteResult(2, "ok", false, "message", "TYPE A REPLY FIRST");

            HashSet<uint> processIds = testProcessId > 0
                ? new HashSet<uint>(new[] { testProcessId })
                : GetOfficialProcessIds();
            Trace("processes:" + processIds.Count);
            if (processIds.Count == 0 && string.IsNullOrEmpty(testWindowTitle))
                return WriteResult(3, "ok", false, "found", false, "message", "THE MAIN APP WINDOW WAS NOT FOUND");

            var windows = new List<WindowInfo>();
            for (int attempt = 0; attempt < 20 && windows.Count == 0; attempt++)
            {
                windows = GetOfficialWindows(processIds, testWindowTitle);
                Trace("windows:" + windows.Count);
                if (windows.Count == 0) Thread.Sleep(250);
            }
            if (windows.Count == 0)
                return WriteResult(3, "ok", false, "found", false, "message", "THE MAIN APP WINDOW WAS NOT FOUND");

            if (focusOnly)
            {
                WindowInfo focusTarget = windows[0];
                bool focused = SetTargetForeground(focusTarget.Handle);
                return WriteResult(focused ? 0 : 5,
                    "ok", focused,
                    "found", true,
                    "focused", focused,
                    "handle", focusTarget.Handle.ToInt64(),
                    "title", focusTarget.Title,
                    "message", focused ? "LAIN'S MAIN WINDOW IS READY" : "THE MAIN APP WINDOW DID NOT ACCEPT FOCUS");
            }

            TargetRoute target = FindTarget(windows, threadTitle);
            Trace("target:" + (target == null ? "none" : target.Route));
            if (target == null)
                return WriteResult(4, "ok", false, "found", true, "message", "THE MATCHING TASK REPLY FIELD WAS NOT FOUND");

            if (probe)
                return WriteResult(0, "ok", true, "found", true, "route", target.Route, "title", threadTitle,
                    "editorReady", target.Editor != null, "replyControlReady", target.ReplyControl != null);

            Trace("focus-start");
            if (!SetTargetForeground(target.Window.Handle))
                return WriteResult(5, "ok", false, "found", true, "message", "THE MAIN APP WINDOW DID NOT ACCEPT FOCUS");
            Trace("focus-ready");

            string expectedEditorName = "Follow up on " + threadTitle;
            if (target.Editor == null && target.ReplyControl != null)
            {
                Trace("reply-open-start");
                if (!InvokeReplyControl(target.ReplyControl))
                    return WriteResult(6, "ok", false, "found", true, "message", "THE TASK REPLY CONTROL COULD NOT BE OPENED");
                Trace("reply-open-invoked");

                for (int attempt = 0; attempt < 30 && target.Editor == null; attempt++)
                {
                    Thread.Sleep(100);
                    target.Root = AutomationElement.FromHandle(target.Window.Handle);
                    target.Editor = FindNamedControl(target.Root, ControlType.Edit, expectedEditorName);
                    Trace("reply-editor-wait:" + (target.Editor != null));
                }
            }
            if (target.Editor == null)
                return WriteResult(6, "ok", false, "found", true, "message", "THE TASK REPLY FIELD DID NOT OPEN");

            object valueObject;
            if (!target.Editor.TryGetCurrentPattern(ValuePattern.Pattern, out valueObject))
                return WriteResult(8, "ok", false, "found", true, "message", "THE TASK REPLY FIELD CANNOT ACCEPT TEXT");

            var valuePattern = (ValuePattern)valueObject;
            string previousValue = valuePattern.Current.Value ?? string.Empty;
            Trace("value-ready");
            if (previousValue.Trim().Length > 0 && previousValue != text)
                return WriteResult(7, "ok", false, "found", true, "message", "THE TASK ALREADY HAS AN UNSENT DRAFT");

            valuePattern.SetValue(text);
            Trace("value-set");
            Thread.Sleep(80);
            target.Editor.TryGetCurrentPattern(ValuePattern.Pattern, out valueObject);
            string confirmedValue = ((ValuePattern)valueObject).Current.Value ?? string.Empty;
            if (confirmedValue != text)
            {
                valuePattern.SetValue(previousValue);
                return WriteResult(8, "ok", false, "found", true, "message", "THE REPLY COULD NOT BE PLACED IN THE TASK FIELD");
            }

            SetTargetForeground(target.Window.Handle);
            target.Editor.SetFocus();
            Thread.Sleep(80);
            Trace("send-enter");
            SendKeys.SendWait("{ENTER}");
            Trace("send-enter-complete");

            for (int attempt = 0; attempt < 50; attempt++)
            {
                Thread.Sleep(100);
                try
                {
                    target.Root = AutomationElement.FromHandle(target.Window.Handle);
                    AutomationElement currentEditor = target.Route == "main-composer"
                        ? FindMainComposer(target.Root, threadTitle)
                        : FindNamedControl(target.Root, ControlType.Edit, expectedEditorName);
                    if (currentEditor == null)
                        return WriteResult(0, "ok", true, "submitted", true, "route", target.Route, "message", "LAIN RECEIVED THE REPLY");

                    object currentValueObject;
                    if (!currentEditor.TryGetCurrentPattern(ValuePattern.Pattern, out currentValueObject)) continue;
                    string currentValue = ((ValuePattern)currentValueObject).Current.Value ?? string.Empty;
                    if (currentValue.Length == 0)
                        return WriteResult(0, "ok", true, "submitted", true, "route", target.Route, "message", "LAIN RECEIVED THE REPLY");
                    if (currentValue != text)
                        return WriteResult(9, "ok", false, "found", true, "message", "THE REPLY FIELD CHANGED BEFORE DELIVERY COULD BE CONFIRMED");
                }
                catch (ElementNotAvailableException)
                {
                    return WriteResult(0, "ok", true, "submitted", true, "route", target.Route, "message", "LAIN RECEIVED THE REPLY");
                }
            }

            try
            {
                target.Root = AutomationElement.FromHandle(target.Window.Handle);
                AutomationElement currentEditor = FindNamedControl(target.Root, ControlType.Edit, expectedEditorName);
                if (currentEditor != null && currentEditor.TryGetCurrentPattern(ValuePattern.Pattern, out valueObject))
                    ((ValuePattern)valueObject).SetValue(previousValue);
            }
            catch { }
            return WriteResult(10, "ok", false, "found", true, "message", "THE REPLY WAS NOT ACCEPTED BY THE TASK FIELD");
        }
        catch (Exception error)
        {
            return WriteResult(11, "ok", false, "message", "THE REPLY BRIDGE COULD NOT COMPLETE", "detail", error.Message);
        }
    }
}
