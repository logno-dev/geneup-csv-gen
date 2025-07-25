# GeneUP CSV Generator

A client-side web application that converts Excel files containing lab test data into CSV files formatted for GeneUP processing.

## Features

- **Drag & Drop Interface**: Simply drag Excel files onto the application or use the file picker
- **Multiple File Processing**: Process multiple Excel files at once
- **Automatic Assay Mapping**: Converts test names to standardized assay codes
- **Separate CSV Generation**: Creates individual CSV files for each assay type
- **Client-Side Processing**: All processing happens in your browser - no data is sent to servers

## Assay Mapping

The application automatically maps test names to assay codes:

| Assay Code | Test Name |
|------------|-----------|
| SLM | Salmonella PCR |
| ECO | ECO157 PCR |
| EH1 | STEC PCR |
| LIS | Listeria PCR |
| LMO | Listeria monocytogenes PCR |

## Usage

1. **Start the application**:
   ```bash
   npm run dev
   ```

2. **Upload Excel files**:
   - Drag and drop Excel files (.xlsx, .xls) onto the drop zone
   - Or click to select files using the file picker

3. **Process files**:
   - Click "Process Files" to convert the Excel data
   - The application will group samples by assay type

4. **Download CSV files**:
   - Download individual CSV files for each assay type
   - Or use "Download All CSVs" to get all files at once

## Input Format

Excel files should contain columns:
- `Sample Num`: The sample identifier (becomes Sample Id in CSV)
- `Test Name`: The test name used for assay mapping

## Output Format

Generated CSV files contain:
- `Sample Id`: From the Excel "Sample Num" column
- `Assay`: Mapped assay name
- `Matrix`, `Customer`, `ProductionLotNumber`, `Notes`: Empty fields for manual entry

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run linter
npm run lint
```
