# Shield threshold notes

Method: pHash (32x32 DCT) + dHash (9x8), plus mirrored variants. Match = both hashes within threshold, minimum over original and mirror. Threshold: 10 of 64 bits.

| Variant of original | Match distance | Result |
|---|---|---|
| Exact copy | 0 | Blocked |
| Resized / slightly cropped | 2 | Blocked |
| Mirrored + brightened | 6 | Blocked |
| Mirrored + darker, more contrast | 12 | Passes |
| Mirrored + small crop | 17 | Passes |
| Mirrored + heavy dark vignette | 23 | Passes |
| Rotated 90 degrees | 27 | Passes |
| Mirrored + tight crop | 30 | Passes |

Not measured: false-positive rate on unrelated photos (negatives test skipped for time).
Known limits: heavy crops, rotation, heavy tone edits. Roadmap: patch-based matching.
