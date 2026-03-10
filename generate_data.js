import { faker } from '@faker-js/faker';
import fs from 'fs';
import path from 'path';

// Set locale to German (Switzerland)
faker.locale = 'de_CH';

// Load lastnames with frequencies
const lastnamesWithFrequency = JSON.parse(
  fs.readFileSync('unique_lastnames.json', 'utf8'),
);

// Calculate total frequency for weighted selection
const totalFrequency = lastnamesWithFrequency.reduce(
  (sum, item) => sum + item.frequency,
  0,
);

// Load Swiss locations (cities and postal codes)
const swissLocations = JSON.parse(
  fs.readFileSync('swiss_locations.json', 'utf8'),
);

// Parse command line arguments
const args = process.argv.slice(2);
let numRecords = 100; // default

if (args.length > 0) {
  const parsed = parseInt(args[0]);
  if (!isNaN(parsed) && parsed > 0) {
    numRecords = parsed;
  } else {
    console.error('Invalid number of records. Using default: 100');
  }
}

// Configuration for chunked writing
const CHUNK_SIZE = 10000; // Write every 10,000 records

// Helper function to randomly select from array
const randomFromArray = (arr) => arr[Math.floor(Math.random() * arr.length)];

// Weighted random selection for lastnames based on frequency
const selectWeightedLastname = () => {
  let random = Math.random() * totalFrequency;

  for (const item of lastnamesWithFrequency) {
    random -= item.frequency;
    if (random <= 0) {
      return item.lastname;
    }
  }

  // Fallback (should never reach here)
  return lastnamesWithFrequency[0].lastname;
};

// Generate Swiss phone number (format: 0XX XXX XX XX)
const generateSwissPhone = () => {
  const areaCodes = [
    '21',
    '22',
    '24',
    '26',
    '27',
    '31',
    '32',
    '33',
    '34',
    '41',
    '43',
    '44',
    '52',
    '55',
    '56',
    '61',
    '62',
    '71',
    '81',
    '91',
  ];
  const areaCode = randomFromArray(areaCodes);
  const part1 = faker.string.numeric(3);
  const part2 = faker.string.numeric(2);
  const part3 = faker.string.numeric(2);
  return `0${areaCode} ${part1} ${part2} ${part3}`;
};

// Generate Swiss mobile number (format: 07X XXX XX XX)
const generateSwissMobile = () => {
  const mobilePrefix = randomFromArray(['76', '77', '78', '79']);
  const part1 = faker.string.numeric(3);
  const part2 = faker.string.numeric(2);
  const part3 = faker.string.numeric(2);
  return `0${mobilePrefix} ${part1} ${part2} ${part3}`;
};

// Generate data
const generateRecord = (index) => {
  const salutations = ['Herr', 'Frau', 'k.A.'];
  const titles = ['', '', '', '', 'Dr.', 'Prof.', 'Prof. Dr.']; // More empty strings for higher probability of no title
  const newsletters = ['', 'ja'];

  const salutation = randomFromArray(salutations);
  const title = randomFromArray(titles);

  // Use weighted selection for lastname based on frequency
  const lastname = selectWeightedLastname();

  // Generate firstname based on salutation
  let firstname;
  if (salutation === 'Herr') {
    firstname = faker.person.firstName('male');
  } else if (salutation === 'Frau') {
    firstname = faker.person.firstName('female');
  } else {
    firstname = faker.person.firstName();
  }

  // Generate birthdate using Faker (some may be empty)
  const birthdate =
    Math.random() > 0.3
      ? faker.date
          .birthdate({ min: 1920, max: 2010, mode: 'year' })
          .toLocaleDateString('de-CH')
      : '';

  // Generate address - use Swiss locations
  const street = faker.location.street();
  const houseNumber =
    Math.random() > 0.2 ? faker.location.buildingNumber() : '';

  // Use real Swiss postal code and city
  const location = randomFromArray(swissLocations);
  const zipCode = location.postalCode;
  const city = location.city;

  // Generate Swiss contact info (some fields may be empty)
  const phone = Math.random() > 0.4 ? generateSwissPhone() : '';
  const mobile = Math.random() > 0.5 ? generateSwissMobile() : '';
  const fax = Math.random() > 0.8 ? generateSwissPhone() : '';

  // Generate email using Faker
  const email =
    Math.random() > 0.3
      ? faker.internet.email({
          firstName: firstname,
          lastName: lastname,
          provider: faker.helpers.arrayElement([
            'anymail.none',
            'domain.none',
            'ultramail.none',
            'company.none',
            'mymail.none',
            'xyz.none',
          ]),
        })
      : '';

  const newsletter = randomFromArray(newsletters);

  // Generate registration date using Faker (between 1949 and 2025)
  const registrationDate = faker.date
    .between({ from: '1949-01-01', to: '2025-12-31' })
    .toLocaleDateString('de-CH');

  return {
    nr: index + 1,
    salutation,
    title,
    firstname,
    lastname,
    birthdate,
    street,
    houseNumber,
    zipCode,
    city,
    phone,
    mobile,
    fax,
    email,
    newsletter,
    registrationDate,
  };
};

// Format record as CSV row
const formatRow = (record) => {
  return [
    record.nr,
    record.salutation,
    record.title,
    record.firstname,
    record.lastname,
    record.birthdate,
    record.street,
    record.houseNumber,
    record.zipCode,
    record.city,
    record.phone,
    record.mobile,
    record.fax,
    record.email,
    record.newsletter,
    record.registrationDate,
  ].join(';');
};

// Generate CSV with chunked writing for large datasets
const generateCSV = () => {
  const header =
    'Nr.;Anrede;Titel;Vorname;Nachname;Geburtsdatum;Straße;Hausnummer;Postleitzahl;Stadt;Telefon;Mobil;Telefax;EMail;Newsletter;Eintragsdatum';

  // Ensure output directory exists
  const outputDir = 'output';
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const filename = path.join(outputDir, `generated_data_${numRecords}.csv`);

  console.log(`\n${'='.repeat(60)}`);
  console.log(
    `Generating ${numRecords.toLocaleString('de-CH')} records with weighted lastname selection...`,
  );
  console.log(`Output file: ${filename}`);
  console.log(
    `Writing in chunks of ${CHUNK_SIZE.toLocaleString('de-CH')} records`,
  );
  console.log(`${'='.repeat(60)}\n`);

  const startTime = Date.now();

  // Write header
  fs.writeFileSync(filename, header + '\n', 'utf8');

  let chunk = [];

  for (let i = 0; i < numRecords; i++) {
    const record = generateRecord(i);
    const row = formatRow(record);
    chunk.push(row);

    // Write chunk when it reaches CHUNK_SIZE or at the end
    if (chunk.length >= CHUNK_SIZE || i === numRecords - 1) {
      fs.appendFileSync(filename, chunk.join('\n') + '\n', 'utf8');
      chunk = [];

      const progress = (((i + 1) / numRecords) * 100).toFixed(2);
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      const recordsPerSec = (
        ((i + 1) / (Date.now() - startTime)) *
        1000
      ).toFixed(0);
      const remaining = ((numRecords - i - 1) / recordsPerSec).toFixed(0);

      console.log(
        `Progress: ${(i + 1).toLocaleString('de-CH')}/${numRecords.toLocaleString('de-CH')} (${progress}%) | ` +
          `Elapsed: ${elapsed}s | Speed: ${recordsPerSec} rec/s | ETA: ${remaining}s`,
      );
    }
  }

  const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
  const avgSpeed = ((numRecords / (Date.now() - startTime)) * 1000).toFixed(0);

  console.log(`\n${'='.repeat(60)}`);
  console.log(
    `✓ Successfully generated ${numRecords.toLocaleString('de-CH')} records`,
  );
  console.log(`✓ Total time: ${totalTime}s`);
  console.log(`✓ Average speed: ${avgSpeed} records/second`);
  console.log(`✓ Output file: ${filename}`);
  console.log(`${'='.repeat(60)}\n`);
};

// Run the generator
generateCSV();

// Made with Bob
