import { partition, round } from 'lodash-es';
import {
	partionHidden,
	sortFiles,
} from '../utils.js';

const percent = (fraction) => {
	if (fraction < 0.001) { // 0.09% and lower
		fraction = round(fraction, 4);
	} else if (fraction < 0.01) { // 0.9% and lower
		fraction = round(fraction, 3);
	} else { // 1% and higher
		fraction = round(fraction, 2);
	}

	return fraction.toLocaleString(undefined, {
		style: 'percent',
		maximumSignificantDigits: 3,
	});
};

function calculateDiffBy(head, base, property) {
	const delta = head[property] - base[property];
	return {
		delta,
		percent: percent(delta / base[property]),
	};
}

function calculateDiff(head, base) {
	return {
		size: calculateDiffBy(head, base, 'size'),
		sizeGzip: calculateDiffBy(head, base, 'sizeGzip'),
		sizeBrotli: calculateDiffBy(head, base, 'sizeBrotli'),
	};
}

function processPkgFiles(fileMap, type, pkgData) {
	for (const file of pkgData.files) {
		if (!fileMap[file.path]) {
			fileMap[file.path] = {
				path: file.path,
				label: file.label,
			};
		}

		const entry = fileMap[file.path];
		entry[type] = file;

		if (entry.head && entry.base) {
			entry.diff = calculateDiff(entry.head, entry.base);
		}
	}
}

function comparePackages(head, base, {
	sortBy,
	sortOrder,
	hideFiles,
} = {}) {
	const fileMap = {};
	processPkgFiles(fileMap, 'head', head);
	processPkgFiles(fileMap, 'base', base);

	const allFiles = Object.values(fileMap);

	sortFiles(allFiles, sortBy, sortOrder);

	const [hidden, files] = partionHidden(hideFiles, allFiles);
	const [unchanged, changed] = partition(
		files,
		file => (file.diff && file.diff.size.delta === 0),
	);

	return {
		head,
		base,
		diff: {
			...calculateDiff(head, base),
			tarballSize: calculateDiffBy(head, base, 'tarballSize'),
		},
		files: {
			changed,
			unchanged,
			hidden,
		},
	};
}

export default comparePackages;
