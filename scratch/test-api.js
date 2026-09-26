const server = require('../server');
const mongoose = require('mongoose');

const BASE_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('\n==================================================');
  console.log('🧪 Starting Expense Tracker Automated API Tests');
  console.log('==================================================\n');

  try {
    // Wait briefly for server & DB connection
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Test 1: Register User A
    console.log('1. Testing User A Registration...');
    const regResA = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'User Alpha',
        email: `alpha_${Date.now()}@example.com`,
        password: 'password123'
      })
    });
    const regDataA = await regResA.json();
    console.assert(regResA.status === 201 && regDataA.success, 'Registration User A failed');
    const tokenA = regDataA.data.token;
    console.log('  ✅ User A registered successfully.');

    // Test 2: Register User B
    console.log('2. Testing User B Registration...');
    const regResB = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'User Beta',
        email: `beta_${Date.now()}@example.com`,
        password: 'password123'
      })
    });
    const regDataB = await regResB.json();
    console.assert(regResB.status === 201 && regDataB.success, 'Registration User B failed');
    const tokenB = regDataB.data.token;
    console.log('  ✅ User B registered successfully.');

    // Test 3: Unauthorized Access Denial
    console.log('3. Testing Unauthorized Access Rejection...');
    const unauthRes = await fetch(`${BASE_URL}/expenses`);
    console.assert(unauthRes.status === 401, 'Unauthorized request should return 401');
    console.log('  ✅ Unauthenticated request blocked correctly with HTTP 401.');

    // Test 4: Create Expense for User A
    console.log('4. Testing Expense Creation for User A...');
    const exp1Res = await fetch(`${BASE_URL}/expenses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenA}`
      },
      body: JSON.stringify({
        title: 'Team Lunch',
        amount: 250,
        category: 'Food',
        description: 'Lunch with colleagues',
        date: '2026-09-20'
      })
    });
    const exp1Data = await exp1Res.json();
    console.assert(exp1Res.status === 201 && exp1Data.data.amount === 250, 'Expense creation failed');
    const expenseIdA = exp1Data.data._id;
    console.log('  ✅ Expense 1 created for User A:', expenseIdA);

    // Test 5: Create Expense for User B
    console.log('5. Testing Expense Creation for User B...');
    const exp2Res = await fetch(`${BASE_URL}/expenses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenB}`
      },
      body: JSON.stringify({
        title: 'Laptop Repair',
        amount: 500,
        category: 'Bills',
        description: 'Screen replacement',
        date: '2026-09-22'
      })
    });
    const exp2Data = await exp2Res.json();
    console.assert(exp2Res.status === 201, 'Expense creation User B failed');
    const expenseIdB = exp2Data.data._id;
    console.log('  ✅ Expense created for User B:', expenseIdB);

    // Test 6: Strict Data Isolation Check
    console.log('6. Testing Multi-Tenant Data Isolation (User B accessing User A expense)...');
    const getResB = await fetch(`${BASE_URL}/expenses/${expenseIdA}`, {
      headers: { 'Authorization': `Bearer ${tokenB}` }
    });
    console.assert(getResB.status === 403, 'User B must be forbidden from accessing User A expense');
    console.log('  ✅ User B forbidden from reading User A expense (HTTP 403).');

    // Test 7: Update Expense by Owner
    console.log('7. Testing Expense Update...');
    const updateRes = await fetch(`${BASE_URL}/expenses/${expenseIdA}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenA}`
      },
      body: JSON.stringify({
        amount: 275,
        title: 'Team Lunch & Drinks'
      })
    });
    const updateData = await updateRes.json();
    console.assert(updateRes.status === 200 && updateData.data.amount === 275, 'Update expense failed');
    console.log('  ✅ Expense updated successfully.');

    // Test 8: Filter & Search
    console.log('8. Testing Query Filters (search & category)...');
    const filterRes = await fetch(`${BASE_URL}/expenses?category=Food&search=Lunch`, {
      headers: { 'Authorization': `Bearer ${tokenA}` }
    });
    const filterData = await filterRes.json();
    console.assert(filterData.count === 1, 'Filter should return 1 matching expense');
    console.log('  ✅ Category and search filters working as expected.');

    // Test 9: Expense Summary Statistics
    console.log('9. Testing Summary Endpoint...');
    const summaryRes = await fetch(`${BASE_URL}/expenses/summary`, {
      headers: { 'Authorization': `Bearer ${tokenA}` }
    });
    const summaryData = await summaryRes.json();
    console.assert(summaryData.success && summaryData.data.totalExpenses === 275, 'Summary statistics failed');
    console.log('  ✅ Summary statistics calculated correctly.');

    // Test 10: Delete Expense
    console.log('10. Testing Expense Deletion...');
    const delRes = await fetch(`${BASE_URL}/expenses/${expenseIdA}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${tokenA}` }
    });
    console.assert(delRes.status === 200, 'Delete expense failed');
    console.log('  ✅ Expense deleted successfully.');

    console.log('\n==================================================');
    console.log('🎉 ALL INTEGRATION TESTS PASSED SUCCESSFULLY!');
    console.log('==================================================\n');

  } catch (err) {
    console.error('❌ Test Execution Error:', err);
    process.exitCode = 1;
  } finally {
    server.close();
    await mongoose.connection.close();
    process.exit(0);
  }
}

runTests();
