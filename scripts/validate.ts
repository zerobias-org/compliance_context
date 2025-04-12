
import fs from 'fs/promises';
import path from 'path';
import yaml from 'yaml';
import { UUID, URL } from '@auditmation/types-core-js';

function isKnownFileType(filename: string): boolean {
  return (filename.toLowerCase().endsWith('.yml') || filename.toLowerCase().endsWith('.json'));
}

async function readAndParseFile(file: string, fullPathFile: string): Promise<any> {
  if (isKnownFileType(file)) {
    const fileData = (await fs.readFile(fullPathFile)).toString();

    // eslint-disable-next-line no-await-in-loop
    let name = file;

    if (name.indexOf('/') !== -1) {
      name = name.substring(name.lastIndexOf('/') + 1);
    }

    name = name.substring(0, name.lastIndexOf('.'));

    let document = null;

    if (file.endsWith('.yml')) {
      // YAML parser
      document = yaml.parse(fileData);
    } else if (file.endsWith('.json')) {
      // Native JSON parser
      document = JSON.parse(fileData);
    }

    return document;
  }

  throw new Error(`File type not supported: ${file}`);
}

function processPackageJson(packageFile: Record<string, any>, code: string, offerings: string[]): void {
  let check: any = packageFile.name !== undefined && packageFile.name !== null && packageFile.name === `@zerobias-org/compliance_context-zerobias-${code}`
    ? true : new Error('package.json missing name or not set to @zerobias-org/compliance_context-zerobias-<code>');

  check = packageFile.description !== undefined && packageFile.description !== null
    ? true : new Error('package.json missing description or needs replacement from {segmentName}');
  if (packageFile.description.includes('{name}')) {
    throw new Error('package.json description needs replacement from {segmentName}');
  }

  if (packageFile.auditmation && typeof packageFile.auditmation === 'object') {
    const auditmation = packageFile.auditmation;
    check = auditmation['import-artifact'] !== undefined && auditmation['import-artifact'] !== null && auditmation['import-artifact'] === 'compliance_context'
      ? true : new Error('package.json auditmation section missing import-artifact or not set to compliance_context');
    check = auditmation.package !== undefined && auditmation.package !== null && auditmation.package === `zerobias.${code}.compliance_context`
      ? true : new Error('package.json auditmation section missing package or not set to zerobias.<code>.compliance_context');
    check = auditmation['dataloader-version'] !== undefined && auditmation['dataloader-version'] !== null ? true
      : new Error('package.json auditmation section missing dataloader-version');
  } else {
    throw new Error(`package.json missing auditmation section`);
  }

  if (offerings.length > 0) {
    const dependencies = packageFile.dependencies !== undefined && packageFile.dependencies !== null ? packageFile.dependencies : {};
    for (const offering of offerings) {
      // if (dependencies[`@zerobias-org/compliance_context-zerobias-${parent}`] === undefined
      //   || dependencies[`@zerobias-org/compliance_context-zerobias-${parent}`] === null) {
      //   throw new Error(`package.json missing dependency for parent '@zerobias-org/compliance_context-zerobias-${parent}'`);
      // }
    }
  }
}

async function processIndexYml(indexFile: Record<string, any>): Promise<string> {
  const code = indexFile.code !== undefined && indexFile.code !== null && indexFile.code !== '{code}' ? indexFile.code
    : new Error('code not found in index.yml');
  if (typeof code !== 'string') {
    throw new Error('code in index.yml needs replacement from {code}');
  }

  let check: any;
  check = indexFile.id !== undefined && indexFile.id !== null && indexFile.id !== '{id}' ? new UUID(indexFile.id)
    : new Error('id not found in index.yml');
  check = indexFile.name !== undefined && indexFile.name !== null && indexFile.name !== '{name}' ? indexFile.name
    : new Error('name not found in index.yml');
  if (typeof check !== 'string') {
    throw new Error('name in index.yml needs replacement from {name}');
  }

  check = indexFile.description !== undefined && indexFile.description !== null && indexFile.description !== '{description}'
    ? indexFile.description : new Error('description not found in index.yml');
  if (typeof check !== 'string') {
    throw new Error('description in index.yml needs replacement from {description}');
  }

  check = indexFile.imageUrl !== undefined && indexFile.imageUrl !== null ? new URL(indexFile.imageUrl) : true;
  check = indexFile.externalId !== undefined && indexFile.externalId !== null && indexFile.externalId !== '{externalId}'
    ? indexFile.externalId : new Error('externalId not found in index.yml');
  if (typeof check !== 'string') {
    throw new Error('externalId in index.yml needs replacement from {externalId}');
  }

  check = indexFile.aliases !== undefined && indexFile.aliases !== null ? indexFile.aliases : [];
  for (const alias of check) {
    if (typeof alias !== 'string') {
      throw new Error('aliases in index.yml needs to be a string[]');
    }
  }
 
  return code;
}

async function processOfferingsYml(offeringsFile: Record<string, any>): Promise<string[]> {
  return [];
}

async function processArtifact(directory: string) {
  const checkDir = await fs.lstat(directory)
    .catch(() => undefined);

  if (!checkDir || !checkDir.isDirectory()) {
    throw new Error(`Path given is not found or not a directory: ${directory}`);
  }

  const checkIndexYml = await fs.lstat(path.join(directory, 'index.yml'))
    .catch(() => undefined);

  if (!checkIndexYml || !checkIndexYml.isFile()) {
    throw new Error(`index.yml file not found or not file in directory: ${directory}`);
  }

  const indexYml = await readAndParseFile('index.yml', path.join(directory, 'index.yml'));
  if (!indexYml) {
    throw new Error('Unable to parse index.yml');
  }

  const code = await processIndexYml(indexYml);
  const offeringsYml = await readAndParseFile('offerings.yml', path.join(directory, 'offerings.yml'));
  if (!indexYml) {
    throw new Error('Unable to parse offerings.yml');
  }

  const offerings = await processOfferingsYml(offeringsYml);
  console.log('Validated offerings.yml');
  const checkPackageJson = await fs.lstat(path.join(directory, 'package.json'))
    .catch(() => undefined);

  if (!checkPackageJson || !checkPackageJson.isFile()) {
    throw new Error(`package.json file not found or is not file in directory: ${directory}`);
  }

  const packageJson = await readAndParseFile('package.json', path.join(directory, 'package.json'));
  if (!packageJson) {
    throw new Error('Unable to parse package.json');
  }

  processPackageJson(packageJson, code, offerings);
  console.log('Validated package.json');
  const checkNpmrc = await fs.lstat(path.join(directory, '.npmrc'))
    .catch(() => undefined);

  if (!checkNpmrc || !checkNpmrc.isFile()) {
    throw new Error(`.npmrc file not found or is not file in directory: ${directory}`);
  }

  console.log('Validated .npmrc');
}

(async () => {
  try {
    const directory = './';
    await processArtifact(directory);
    console.log('Validation of artifact completed successfully.');
    process.exit(0);
  } catch (error: any) {
    console.error(`Validation failed \n${error.message}\n${JSON.stringify(error.stack)}`);
    process.exit(1);
  }
})();
