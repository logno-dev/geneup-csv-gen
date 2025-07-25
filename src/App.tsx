import { useState, useCallback } from 'react'
import * as XLSX from 'xlsx'

interface ExcelRow {
  'Sample Num': string
  'Test Name': string
  'Print'?: string
  'Run'?: string
  'Process Group Num'?: string
  'Process Name'?: string
  'Received Date'?: string
  'Expiration Date'?: string
}

interface ProcessedSample {
  sampleId: string
  assay: string
}

interface AssayMapping {
  assayName: string
  testNamePatterns: string[]
}

const ASSAY_MAPPINGS: AssayMapping[] = [
  {
    assayName: 'SLM',
    testNamePatterns: [
      'Salmonella',
      'Sal-PCR GeneUp-375g v.3',
      'Sal-PCR GeneUp-FP v.3'
    ]
  },
  {
    assayName: 'ECO',
    testNamePatterns: [
      'EC0157',
      'ECO157'
    ]
  },
  {
    assayName: 'EH1',
    testNamePatterns: [
      'EHEC',
      'STEC'
    ]
  },
  {
    assayName: 'LIS',
    testNamePatterns: [
      'LIS-PCR GeneUp-ENV(BM) v.1',
      'LIS-PCR GeneUp-FP v.3',
      'Listeria'
    ]
  },
  {
    assayName: 'LMO',
    testNamePatterns: [
      'Listeria monocytogenes',
      'LM-PCR GeneUp-FP v.3'
    ]
  }
]

function App() {
  const [files, setFiles] = useState<File[]>([])
  const [processing, setProcessing] = useState(false)
  const [processedData, setProcessedData] = useState<Record<string, ProcessedSample[]>>({})

  const extractAssayFromTestName = (testName: string): string | null => {
    for (const mapping of ASSAY_MAPPINGS) {
      for (const pattern of mapping.testNamePatterns) {
        if (testName.includes(pattern)) {
          return mapping.assayName
        }
      }
    }
    return null
  }

  const processExcelFile = useCallback(async (file: File): Promise<Record<string, ProcessedSample[]>> => {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: 'array' })
        const worksheet = workbook.Sheets[workbook.SheetNames[0]]
        const jsonData: ExcelRow[] = XLSX.utils.sheet_to_json(worksheet)

        const groupedByAssay: Record<string, ProcessedSample[]> = {}

        jsonData.forEach((row) => {
          const sampleNum = row['Sample Num']
          const testName = row['Test Name']

          if (sampleNum && testName) {
            const assayName = extractAssayFromTestName(testName)

            // Only process samples with known assay mappings
            if (assayName) {
              if (!groupedByAssay[assayName]) {
                groupedByAssay[assayName] = []
              }

              groupedByAssay[assayName].push({
                sampleId: sampleNum,
                assay: assayName
              })
            }
          }
        })
        resolve(groupedByAssay)
      }
      reader.readAsArrayBuffer(file)
    })
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const droppedFiles = Array.from(e.dataTransfer.files).filter(
      file => file.name.endsWith('.xlsx') || file.name.endsWith('.xls')
    )
    setFiles(prev => [...prev, ...droppedFiles])
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
  }, [])

  const processFiles = useCallback(async () => {
    setProcessing(true)
    const allProcessedData: Record<string, ProcessedSample[]> = {}

    for (const file of files) {
      const fileData = await processExcelFile(file)

      Object.entries(fileData).forEach(([assay, samples]) => {
        if (!allProcessedData[assay]) {
          allProcessedData[assay] = []
        }
        allProcessedData[assay].push(...samples)
      })
    }

    setProcessedData(allProcessedData)
    setProcessing(false)
  }, [files, processExcelFile])

  const generateCSV = (samples: ProcessedSample[]): string => {
    const headers = ['Sample Id', 'Assay', 'Matrix', 'Customer', 'ProductionLotNumber', 'Notes']
    const rows = samples.map(sample => [
      sample.sampleId,
      sample.assay,
      '', '', '', ''
    ])

    return [headers, ...rows].map(row => row.join(',')).join('\n')
  }

  const downloadCSV = (assay: string, samples: ProcessedSample[]) => {
    const csv = generateCSV(samples)
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${assay.replace(/\s+/g, '_')}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const downloadAllCSVs = () => {
    Object.entries(processedData).forEach(([assay, samples]) => {
      downloadCSV(assay, samples)
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">GeneUP CSV Generator</h1>

        <div
          className="border-2 border-dashed border-gray-300 rounded-lg p-12 mb-8 bg-white hover:border-blue-400 hover:bg-blue-50 transition-colors duration-300"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          <p className="text-gray-600 mb-2">Drag and drop Excel files here</p>
          <p className="text-gray-500 mb-4">or</p>
          <input
            type="file"
            multiple
            accept=".xlsx,.xls"
            className="block mx-auto text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            onChange={(e) => {
              const selectedFiles = Array.from(e.target.files || [])
              setFiles(prev => [...prev, ...selectedFiles])
            }}
          />
        </div>

        {files.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Selected Files:</h3>
            <ul className="space-y-2 mb-6">
              {files.map((file, index) => (
                <li key={index} className="text-gray-700 py-2 px-4 bg-gray-50 rounded border-b border-gray-200 last:border-b-0">
                  {file.name}
                </li>
              ))}
            </ul>
            <div className="space-x-4">
              <button
                onClick={processFiles}
                disabled={processing}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
              >
                {processing ? 'Processing...' : 'Process Files'}
              </button>
              <button
                onClick={() => setFiles([])}
                className="bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
              >
                Clear Files
              </button>
            </div>
          </div>
        )}

        {Object.keys(processedData).length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-6">Processed Data:</h3>
            <div className="space-y-4 mb-6">
              {Object.entries(processedData).map(([assay, samples]) => (
                <div key={assay} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <h4 className="text-lg font-medium text-gray-700 mb-3">
                    {assay} ({samples.length} samples)
                  </h4>
                  <button
                    onClick={() => downloadCSV(assay, samples)}
                    className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                  >
                    Download {assay} CSV
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={downloadAllCSVs}
              className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 px-8 rounded-lg transition-colors duration-200"
            >
              Download All CSVs
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
