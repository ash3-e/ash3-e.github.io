const fs = require('fs');

const file_path = "c:\\Users\\^w^\\Downloads\\site\\assets\\codex-site.js";
const content = fs.readFileSync(file_path, "utf-8");

// We extract the DOC_NODE_PREVIEWS and fitPreviewSentences function to test it

// Simple extraction
const jsonMatchNode = content.match(/const DOC_NODE_PREVIEWS = (\{[\s\S]*?\});\n\n/);
if (!jsonMatchNode) {
    console.log("Failed to find DOC_NODE_PREVIEWS");
    process.exit(1);
}

const docNodePreviews = eval("(" + jsonMatchNode[1] + ")");
const intro = docNodePreviews.intro;

// Let's simulate what fitPreviewSentences does:
// It takes paragraphs and fits them into MaxLength based on resolution.
// For 1080p, the limit inside getPreviewForDoc is usually 350-500 chars per paragraph.
// Let's check lengths.

console.log("INTRO P1 length:", intro.paragraphs[0].length);
console.log("INTRO P2 length:", intro.paragraphs[1].length);
console.log("Number of bullets:", intro.bullets.length);

const isLengthAcceptable = (len) => {
    // A 1080p standard text block might hold about 400-500 chars safely before looking cramped.
    return len > 200 && len < 650;
};

console.log("P1 is Acceptable for 1080p:", isLengthAcceptable(intro.paragraphs[0].length));
console.log("P2 is Acceptable for 1080p:", isLengthAcceptable(intro.paragraphs[1].length));

if (!isLengthAcceptable(intro.paragraphs[0].length) || !isLengthAcceptable(intro.paragraphs[1].length)) {
    console.log("WARNING: Paragraph lengths are outside expected comfortable bounds (200-650 chars).");
} else {
    console.log("SUCCESS: Paragraph lengths are well balanced for a 1080p/1440p preview.");
}

// Checking the no-number rule on subtopics
const jsonMatchRow = content.match(/const DOC_ROW_CONFIGS = (\{[\s\S]*?\});\n\n/);
if (jsonMatchRow) {
    const docRowConfigs = eval("(" + jsonMatchRow[1] + ")");
    let violation = false;
    for (const key in docRowConfigs) {
        docRowConfigs[key].forEach(config => {
            if (/^\d+\./.test(config.label)) {
                console.log(`VIOLATION: Subtitle still contains number: ${config.label}`);
                violation = true;
            }
            // Check bullets count
            if (config.bullets.length !== 10) {
                 console.log(`VIOLATION: Bullets length is ${config.bullets.length} for ${config.label}`);
                 violation = true;
            }
        });
    }
    if (!violation) {
        console.log("SUCCESS: All row configs cleanly conform to 10 bullets and no numbered prefixes.");
    }
}
