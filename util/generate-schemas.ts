
import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { createGenerator } from "ts-json-schema-generator";
import Ajv, { AnySchema } from "ajv";
import standaloneCode from "ajv/dist/standalone";

type ExportedType = {
	name: string;
	file: string;
};

const repoDir = path.resolve(import.meta.dirname, "..");
const clientDir = path.join(repoDir, "client");

const typesDir = path.join(clientDir, "src", "types");
const schemasDir = path.join(clientDir, "src", "schemas");
const tsconfig = path.join(clientDir, "tsconfig.schema.json");


const removeFiles = async (dir: string, suffix: string) => {
    await mkdir(dir, {
        recursive: true,
    });

    const files = await readdir(dir, {
        withFileTypes: true,
    });

    for (const file of files) {
        if (
            file.isFile() &&
            file.name.endsWith(suffix)
        ) {
            await rm(path.join(dir, file.name));
        }
    }
};

const generateValidators = async (schemasDir: string,	validatorsDir: string) => {
	await removeFiles(validatorsDir, ".js");

	const schemaFiles = await readdir(schemasDir, {
		withFileTypes: true,
	});
	schemaFiles.sort((a, b) => a.name.localeCompare(b.name));
	

	const indexExports: string[] = [];

	for (const file of schemaFiles) {
		if (!file.isFile()) {
			continue;
		}

		if (!file.name.endsWith(".schema.json")) {
			continue;
		}

		const schemaFile = path.join(
			schemasDir,
			file.name,
		);

		const validatorName = file.name.replace(
			/\.schema\.json$/,
			"",
		);

		const validatorFile = path.join(
			validatorsDir,
			`${validatorName}.js`,
		);

		console.log(`Generating ${validatorName} validator...`);

		const schema = JSON.parse(
			await readFile(schemaFile, "utf8"),
		) as AnySchema;

		const ajv = new Ajv({
			code: {
				esm: true,
				source: true,
			},
		});

		const validate = ajv.compile(schema);

		const code = standaloneCode(
			ajv,
			validate,
		);

		await writeFile(
			validatorFile,
			code + "\n",
		);

		console.log(
			`  -> ${path.relative(repoDir, validatorFile)}`,
		);

		indexExports.push(
			`export { default as ${validatorName} } from "./${validatorName}.js";`,
		);
	}

	indexExports.sort();

	await writeFile(
		path.join(validatorsDir, "index.js"),
		indexExports.join("\n") + "\n",
	);

	console.log(`Generated ${indexExports.length} validator(s).`);
};

const walk = async (dir: string): Promise<string[]> => {
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

const findExportedTypes = async (file: string): Promise<ExportedType[]> => {
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

const main = async () => {
	await removeFiles(schemasDir, ".schema.json");

	const files = await walk(typesDir);
	files.sort();

	const exportedTypes: ExportedType[] = [];

	for (const file of files) {
		exportedTypes.push(...await findExportedTypes(file));
	}
	exportedTypes.sort((a, b) => a.name.localeCompare(b.name));

	const seen = new Map<string, string>();

	for (const item of exportedTypes) {
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

	const validatorsDir = path.join(
		clientDir,
		"src",
		"validators",
		"default",
	);

	await generateValidators(schemasDir, validatorsDir);
	console.log("Done.");
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});