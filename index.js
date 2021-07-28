const path = require('path');

const {
	clearOldBuilds,
	generatePNGsFromBase64Images,
	generateSpritesheetImage,
	generateSpritesheetImageStylesheet,
	generateAudiospriteFiles,
} = require('./spritegen.js');

const base64Images = require('./assets/images/base64-images.json');
const pngImageDir = path.join(__dirname, 'assets/images/png', '/');
const soundsDir = path.join(__dirname, 'assets/sounds/');

const outputDir = path.join(__dirname, 'output');
const spritesheetImageDir = path.join(outputDir, 'image', '/');
const audioSpriteDir = path.join(outputDir, 'audio', '/');

const runSpritegen = async () => {
	clearOldBuilds(pngImageDir, outputDir);

	generatePNGsFromBase64Images(base64Images, pngImageDir);

	const spriteSheetImageInfo = await generateSpritesheetImage({
		inputDir: pngImageDir,
		outputDir: spritesheetImageDir,
		output: path.join(spritesheetImageDir, 'spritesheet.png'),
		padding: 10,
		algorithm: 'binary-tree',
	});

	generateSpritesheetImageStylesheet(spriteSheetImageInfo, {
		format: 'css',
		formatOpts: { cssSelector: (sprite) => `.sprite-${sprite.name}` },
		output: path.join(spritesheetImageDir, 'spritesheet.css'),
	});

	generateAudiospriteFiles({
		inputDir: soundsDir,
		outputDir: audioSpriteDir,
		seekMapOutput: path.join(audioSpriteDir, 'audiosprite.howler2.json'),
		output: path.join(audioSpriteDir, 'audiosprite'),
		export: 'webm,mp3',
		format: 'howler2',
	});
};

runSpritegen();
