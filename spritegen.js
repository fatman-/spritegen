const path = require('path');
const fs = require('fs');

const base64ToImage = require('base64-to-image');
const spritesmith = require('spritesmith');
const spritesheetTemplater = require('spritesheet-templates');

const audiosprite = require('audiosprite-ffmpeg');

const getRelativePath = (toPath) => path.relative(__dirname, toPath);
const ensurePathExists = (path) => (!fs.existsSync(path) ? fs.mkdirSync(path, { recursive: true }) : null);

const clearOldBuilds = (...args) => {
	// 🠗🠗🠗 NOTE: Be careful! I hope you know what you're doing! 🠗🠗🠗
	args.forEach((path) => fs.rmdirSync(path, { recursive: true }));

	console.log('\nCleared old builds.\n');
};

const generatePNGsFromBase64Images = (base64Images, pngImagesPath) => {
	Object.keys(base64Images).forEach((imageKey) => {
		ensurePathExists(pngImagesPath);
		return base64ToImage(base64Images[imageKey].src, pngImagesPath, { fileName: imageKey });
	});
	console.log(`Generated image files (PNGs) using the given base64 data, inside ${getRelativePath(pngImagesPath)}.`);
};

const generateSpritesheetImage = async (spriteSheetImageOptions) => {
	const { inputDir, outputDir, output, padding, algorithm } = spriteSheetImageOptions;

	return new Promise((resolve, reject) => {
		spritesmith.run(
			{
				src: fs.readdirSync(inputDir).map((filename) => path.join(inputDir, filename)),
				padding,
				algorithm,
			},
			function handleResult(err, result) {
				if (err) return reject(err);

				const { image, coordinates, properties } = result;
				const processedCoordinatesObj = Object.keys(coordinates).reduce((acc, imageKey) => {
					const newImageKey = imageKey.split('\\').pop().replace('.png', '');
					acc[newImageKey] = coordinates[imageKey];
					return acc;
				}, {});

				const spritesheetImageInfo = {
					coordinates: processedCoordinatesObj,
					properties,
					spritesheetImagePath: output,
				};

				ensurePathExists(outputDir);
				fs.writeFileSync(output, image);
				console.log(`Generated ${path.basename(output)}, inside ${getRelativePath(outputDir)}.`);

				return resolve(spritesheetImageInfo);
			}
		);
	});
};

const generateSpritesheetImageStylesheet = (spritesheetImageInfo, stylesheetOptions) => {
	const { coordinates, properties, spritesheetImagePath } = spritesheetImageInfo;

	const { format, formatOpts, output } = stylesheetOptions;

	const spritesheetCSS = spritesheetTemplater(
		{
			sprites: Object.keys(coordinates).map((spriteKey) => {
				const { x, y, width, height } = coordinates[spriteKey];
				return { name: spriteKey, x, y, width, height };
			}),
			spritesheet: {
				width: properties.width,
				height: properties.height,
				image: spritesheetImagePath,
			},
		},
		{ format, formatOpts }
	).replace(/\n\s{2}/g, '\n\t'); // Replace spaces with tabs

	fs.writeFileSync(output, spritesheetCSS);
	console.log(`Generated ${path.basename(output)}, inside ${getRelativePath(path.dirname(output))}.`);
};

const generateAudiospriteFiles = async (audioSpriteOptions) => {
	const audioFilenames = fs.readdirSync(audioSpriteOptions.inputDir);
	const audioFilepaths = audioFilenames.map((filename) => path.join(audioSpriteOptions.inputDir, filename));

	return new Promise((resolve, reject) => {
		console.log('\nGenerating audiosprite files...\n');
		audiosprite(audioFilepaths, audioSpriteOptions, function handleResult(err, result) {
			if (err) return reject(err);

			result.src = result.src.map((absPath) => absPath.split('\\').pop());
			fs.writeFileSync(audioSpriteOptions.seekMapOutput, JSON.stringify(result, null, '\t'));
			console.log(
				`Generated audiosprite files (${audioSpriteOptions.export.replace(',', ', ')}), and ${path.basename(
					audioSpriteOptions.seekMapOutput
				)}, inside ${getRelativePath(audioSpriteOptions.outputDir)}.`
			);

			return resolve(result);
		});
	});
};

module.exports = {
	clearOldBuilds,
	generatePNGsFromBase64Images,
	generateSpritesheetImage,
	generateSpritesheetImageStylesheet,
	generateAudiospriteFiles,
};
