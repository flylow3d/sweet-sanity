#!/bin/bash
set -e
G="node tools/gen_image.mjs"

$G "Cheerful interior photograph of a small-town ice cream parlor inside a cozy renovated garage: a glass display case filled with colorful tubs of hand-dipped ice cream, pink green and white decor, white shiplap walls, retro pendant lights, a chalkboard-style blank menu board, warm late-afternoon summer light through the front windows, welcoming hometown feel, no people facing camera, photorealistic editorial photography" --out assets/hero-parlor.png --ar 16:9

$G "Photograph of three waffle cones held up against a soft pink wall, each with two generous scoops of hand-dipped ice cream: dark chocolate raspberry, butter pecan, and toasted coconut, slightly melting in summer light, playful and appetizing, editorial ice cream photography, bright cheerful colors" --out assets/cones.png --ar 4:3

$G "Photograph of an indulgent peanut butter chunk brownie sundae in a clear glass dish: fudgy brownie base, vanilla ice cream scoops, peanut butter sauce, chopped peanut butter cups, whipped cream and a cherry on top, on a mint-green table, bright cheerful ice cream parlor background softly blurred, editorial dessert photography" --out assets/sundae.png --ar 4:3

$G "Photograph of a tall swirl of golden pineapple Dole Whip soft serve in a clear cup beside a rainbow Hawaiian shave ice in a paper cone, on a white counter with pink and mint accents, bright tropical summer feel, editorial dessert photography" --out assets/dolewhip.png --ar 4:3

$G "Photograph of a classic banana split in a long glass boat: three scoops with chocolate strawberry and pineapple toppings, whipped cream, sprinkles and cherries, banana halves, retro pink and white striped background, cheerful editorial dessert photography" --out assets/banana-split.png --ar 4:3

$G "Photograph of picnic tables with large cheerful umbrellas on a small-town patio outside an ice cream shop on a golden summer evening, string lights, a few families enjoying ice cream seen from behind at a distance, midwest small town charm, warm nostalgic editorial photography" --out assets/patio.png --ar 16:9

echo BATCH_DONE
