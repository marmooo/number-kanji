import { ttf2svg } from "npm:@marmooo/ttf2svg@0.1.4";
import { JISCode } from "npm:@marmooo/kanji@0.0.8";

function loadKanjiList() {
  let chars = "ぁあぃいぅうぇえぉおかがきぎくぐけげこごさざしじすずせぜそぞただちぢっつづてでとどなにぬねのはばぱひびぴふぶぷへべぺほぼぽまみむめもゃやゅゆょよらりるれろゎわゐゑをんゔァアィイゥウェエォオカガキギクグケゲコゴサザシジスズセゼソゾタダチヂッツヅテデトドナニヌネノハバパヒビピフブプヘベペホボポマミムメモャヤュユョヨラリルレロヮワヰヱヲンヴヵ";
  JISCode.forEach((list) => {
    chars += list.join("");
  });
  return chars;
}

function parseTTF(chars, inFile, outDir, options = {}) {
  Deno.mkdirSync(outDir, { recursive: true });
  const svgs = ttf2svg(inFile, chars, options);
  for (const { glyph, svg } of svgs) {
    if (!glyph.unicode) continue;
    if (!svg) continue;
    const { x1 } = glyph.getBoundingBox();
    const fileName = Number(glyph.unicode).toString(16);
    const char = String.fromCodePoint(glyph.unicode);
    if (x1 < 0) {
      console.log("x1", x1, glyph.unicode, fileName, char);
      continue;
    }
    // if (y1 < 0) {
    //   console.log("y1", y1, glyph.unicode, fileName, char);
    //   continue;
    // }
    Deno.writeTextFileSync(`${outDir}/${fileName}.svg`, svg);
  }
}

function notoSerifJP(chars) {
  console.log("Noto Serif JP");
  const options = { glyphHeight: 1000, translateY: 850 };
  parseTTF(
    chars,
    "vendor/NotoSerifJP-Regular.otf",
    "docs/svg/noto-serif-jp",
    options,
  );
}

function notoSansJP(chars) {
  console.log("Noto Sans JP");
  const options = { glyphHeight: 1000, translateY: 850 };
  parseTTF(
    chars,
    "vendor/NotoSansJP-Regular.otf",
    "docs/svg/noto-sans-jp",
    options,
  );
}

const chars = loadKanjiList();
console.log(chars.length);
notoSerifJP(chars);
notoSansJP(chars);
