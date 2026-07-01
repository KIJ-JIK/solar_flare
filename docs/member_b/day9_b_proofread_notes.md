# Proofread Notes (Day 9) - Member B

## Overall Status
**Member B sections: READY FOR SUBMISSION**

## Missing Full Draft
**WARNING:** I have checked our local `/docs` folder, and Member D's assembled full draft (e.g., `proposal.md` or `draft_v1.md`) is **NOT** present in this workspace. 

*If D has shared the draft with you via Google Docs or another external tool, you will need to paste the text into a file here so I can verify how our sections were integrated and check cross-references. Until then, my review of D's assembly is incomplete.*

---

## Specific Fixes Needed in My Sections

### In `docs/sections/methodology_final.md`
1. **Missing Label Column Names:**
   - *Current text:* "The model is trained against three boolean ground-truth label columns corresponding to our target forecast horizons..."
   - *Correction:* Add explicit column names to match the contract: "The model is trained against three boolean ground-truth label columns (`label_30min`, `label_60min`, `label_120min`) corresponding to our target forecast horizons..."
2. **Outdated Catalogue Reference:**
   - *Current text:* "...against the master flare detection catalogue."
   - *Correction:* Update to match C's actual delivered JSON: "...against the detected flares catalogue (`detected_flares.json`)."

### In `docs/sections/evaluation_framework.md`
3. **Outdated Note on C's Deliverables (Line 53):**
   - *Current text:* "> **Note for D (proposal assembly):** As of this writing, C has not yet delivered validation plots (`outputs/plots/`) or the master catalogue (`outputs/catalogue/master_catalogue.csv`). Today's README sync point calls for confirming that C's outputs match the format D will reference. Once C shares those artifacts, this section should be quickly cross-checked to ensure the column names (`start_time`, `flare_class`, `confidence`) and evaluation definitions are consistent with C's actual output schema."
   - *Correction:* Delete this entire block. C has delivered the files, and we've already adapted the pipeline to use `detected_flares.json` with `noaa_class`.
4. **Outdated Catalogue Path (Line 51):**
   - *Current text:* "...Member C's real flare catalogue (`outputs/catalogue/master_catalogue.csv`) is produced..."
   - *Correction:* Update to match the JSON file: "...Member C's real flare catalogue (`outputs/catalogue/detected_flares.json`) is produced..."
