import byteSize from 'byte-size';
import markdownTable from 'markdown-table';
import outdent from 'outdent';
import { c, strong } from '../lib/markdown.js';
import {
	partionHidden,
	getSizeLabels,
	parseDisplaySize,
	listSizes,
	sortFiles,
} from './utils.js';

function headOnly({
	headPkgData,
	hideFiles,
	displaySize,
	sortBy,
	sortOrder,
}) {
	const displaySizes = parseDisplaySize(displaySize);
	const sizeHeadingLabel = getSizeLabels(displaySizes);

	sortFiles(headPkgData.files, sortBy, sortOrder);
	const [hidden, files] = partionHidden(hideFiles, headPkgData.files);

	const table = markdownTable([
		['File', `Size${sizeHeadingLabel}`],
		...files.map(file => [
			file.label,
			listSizes(displaySizes, p => c(byteSize(file[p]))),
		]),
		[
			strong('Total'),
			listSizes(displaySizes, p => c(byteSize(headPkgData[p]))),
		],
		[
			strong('Tarball size'),
			c(byteSize(headPkgData.tarballSize)),
		],

	], {
		align: ['', 'r'],
	});

	let hiddenTable = '';
	if (hidden.length > 0) {
		hiddenTable = markdownTable([
			['File', `Size${sizeHeadingLabel}`],
			...hidden.map(file => [
				file.label,
				listSizes(displaySizes, p => c(byteSize(file[p]))),
			]),
		], {
			align: ['', 'r'],
		});

		hiddenTable = `<details><summary>Hidden files</summary>\n\n${hiddenTable}\n</details>`;
	}

	return outdent`
	### 📊 Package size report

	${table}

	${hiddenTable}
	`;
}

export default headOnly;
