Generate or update SVG assets for the BCODe documentation site.

1. run_pipeline with task: SVG generation for ARGUMENTS
2. Read the Python generator script (e.g. gen_compact.py)
3. Apply requested changes to the generator - NOT the SVG directly
4. Run the generator to produce all 3 theme variants (light, dark, balanced)
5. Verify dimensions match across all variants
6. save_observation noting what changed and why
