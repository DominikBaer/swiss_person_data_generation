import fs from 'fs';
import readline from 'readline';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const extractSwissLocations = async () => {
  const locations = [];

  const inputFile = path.join(__dirname, '../data/AMTOVZ_CSV_LV95.csv');
  const outputFile = path.join(__dirname, '../swiss_locations.json');

  const fileStream = fs.createReadStream(inputFile);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  let isFirstLine = true;

  for await (const line of rl) {
    if (isFirstLine) {
      isFirstLine = false;
      continue; // Skip header
    }

    // Parse CSV line - split by semicolon
    const parts = line.split(';');
    if (parts.length >= 3) {
      const city = parts[0]; // Ortschaftsname
      const postalCode = parts[1]; // PLZ4

      if (city && postalCode && postalCode.length === 4) {
        locations.push({
          city: city,
          postalCode: postalCode,
        });
      }
    }
  }

  // Write to file
  fs.writeFileSync(outputFile, JSON.stringify(locations, null, 2));

  console.log(`Extracted ${locations.length} Swiss locations`);
  console.log(`Saved to ${outputFile}`);
};

extractSwissLocations().catch(console.error);

// Made with Bob
