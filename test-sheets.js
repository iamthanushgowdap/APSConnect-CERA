// Quick test to verify Google Sheets connection
const SHEET_ID = '1016j-1SvZtSe5rE961yyB1HzPXUtmnpwjiL-Z6zEbX8';

async function testSheetConnection(sheetName) {
  try {
    const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${sheetName}`;
    console.log(`\n🔍 Testing: ${sheetName}`);
    console.log(`URL: ${url}\n`);
    
    const res = await fetch(url);
    
    if (!res.ok) {
      console.error(`❌ Failed: HTTP ${res.status}`);
      return;
    }

    const text = await res.text();
    const jsonString = text.substring(47).slice(0, -2);
    const json = JSON.parse(jsonString);

    const headers = json.table.cols.map(col => col.label || col.id);
    const rowCount = json.table.rows.length;

    console.log(`✅ Success!`);
    console.log(`   Columns: ${headers.join(', ')}`);
    console.log(`   Rows: ${rowCount}`);
    
    if (rowCount > 0) {
      const firstRow = json.table.rows[0];
      const sample = {};
      firstRow.c.forEach((cell, i) => {
        sample[headers[i]] = cell ? (cell.v !== null ? cell.v : '') : '';
      });
      console.log(`   Sample data:`, sample);
    }
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
  }
}

async function runTests() {
  console.log('🚀 Testing Google Sheets Connection...');
  console.log(`Sheet ID: ${SHEET_ID}\n`);
  
  await testSheetConnection('fee_records');
  await testSheetConnection('attendance_records');
  await testSheetConnection('timetables');
  await testSheetConnection('assignments');
  
  console.log('\n✅ Test complete!');
}

runTests();
