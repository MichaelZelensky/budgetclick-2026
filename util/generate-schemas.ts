// util/generate-schemas.ts

import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { createGenerator } from "ts-json-schema-generator";

const repoDir = path.resolve(import.meta.dirname, "..");
const clientDir = path.join(repoDir, "client");

const typesDir = path.join(clientDir, "src", "types");
const schemasDir = path.join(clientDir, "src", "schemas");
const tsconfig = path.join(clientDir, "tsconfig.schema.json");

type ExportedType = {
	name: string;
	file: string;
};

async function walk(dir: string): Promise<string[]> {
	const entries = await readdir(dir, { withFileTypes: true });

	const files: string[] = [];

	for (const entry of entries) {
		const fullPath = path.join(dir, entry.name);

		if (entry.isDirectory()) {
			files.push(...await walk(fullPath));
			continue;
		}

		if (entry.isFile() && fullPath.endsWith(".ts")) {
			files.push(fullPath);
		}
	}

	return files;
}

async function findExportedTypes(file: string): Promise<ExportedType[]> {
	const source = await readFile(file, "utf8");

	const regex =
		/export\s+(?:type|interface|class|enum)\s+([A-Z][A-Za-z0-9_]*)/g;

	const types: ExportedType[] = [];

	for (const match of source.matchAll(regex)) {
		types.push({
			name: match[1],
			file,
		});
	}

	return types;
}

async function main() {
	await mkdir(schemasDir, {
			recursive: true,
	});

	const schemaFiles = await readdir(schemasDir, {
			withFileTypes: true,
	});

	for (const file of schemaFiles) {
			if (!file.isFile()) {
					continue;
			}

			if (!file.name.endsWith(".schema.json")) {
					continue;
			}

			await rm(path.join(schemasDir, file.name));
	}

	const files = await walk(typesDir);
	files.sort();

	const exports: ExportedType[] = [];

	for (const file of files) {
		exports.push(...await findExportedTypes(file));
	}
	exports.sort((a, b) => a.name.localeCompare(b.name));

	const seen = new Map<string, string>();

	for (const item of exports) {
		const existing = seen.get(item.name);

		if (existing) {
			throw new Error(
				`Duplicate exported type '${item.name}'.\n` +
				`  ${path.relative(repoDir, existing)}\n` +
				`  ${path.relative(repoDir, item.file)}`,
			);
		}

		seen.set(item.name, item.file);
	}

	for (const [typeName, file] of seen) {
		console.log(`Generating ${typeName}...`);

		const config = {
			path: file,
			tsconfig,
			type: typeName,
		};

		const schema = createGenerator(config).createSchema(typeName);

		const outFile = path.join(
			schemasDir,
			`${typeName}.schema.json`,
		);

		await writeFile(
			outFile,
			JSON.stringify(schema, null, 2) + "\n",
		);

		console.log(`  -> ${path.relative(repoDir, outFile)}`);
	}

	console.log(`Generated ${seen.size} schema(s).`);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});