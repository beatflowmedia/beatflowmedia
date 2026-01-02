/**
 * Test script for Investment Strategy Agent
 * Generates sample investment documentation
 */

const InvestmentStrategyAgent = require('../agents/experts/InvestmentStrategyAgent');
const fs = require('fs').promises;
const path = require('path');

async function main() {
  console.log('🚀 Testing Investment Strategy Agent\n');

  // Initialize agent
  const agent = new InvestmentStrategyAgent({
    projectRoot: process.cwd(),
    logLevel: 'info'
  });

  console.log('📊 Generating financial projections...\n');
  const projections = agent.generateFinancialProjections();

  console.log('Year 1-5 Revenue Projections:');
  projections.forEach(year => {
    console.log(`  Year ${year.year}: $${(year.revenue.total / 1000000).toFixed(2)}M revenue, $${(year.metrics.netIncome / 1000000).toFixed(2)}M net income (${year.metrics.netMargin} margin)`);
  });

  console.log('\n💰 Calculating ROI scenarios...\n');

  // Calculate ROI for different investment amounts
  const investments = [25000, 50000, 100000, 250000];
  investments.forEach(amount => {
    const roi = agent.calculateROI(amount);
    console.log(`Investment: $${amount.toLocaleString()}`);
    console.log(`  Equity: ${roi.equityPercentage}`);
    console.log(`  Conservative exit: ${roi.scenarios.conservative.multipleOnInvested.toFixed(1)}x ($${(roi.scenarios.conservative.exitValue / 1000000).toFixed(2)}M)`);
    console.log(`  Moderate exit: ${roi.scenarios.moderate.multipleOnInvested.toFixed(1)}x ($${(roi.scenarios.moderate.exitValue / 1000000).toFixed(2)}M)`);
    console.log(`  Optimistic exit: ${roi.scenarios.optimistic.multipleOnInvested.toFixed(1)}x ($${(roi.scenarios.optimistic.exitValue / 1000000).toFixed(2)}M)\n`);
  });

  console.log('📈 Generating market analysis...\n');
  const market = agent.generateMarketAnalysis();
  console.log(`  TAM: $${(market.totalAddressableMarket.tam / 1000000000).toFixed(1)}B`);
  console.log(`  SAM: $${(market.serviceableAddressableMarket.sam / 1000000000).toFixed(1)}B`);
  console.log(`  SOM: $${(market.serviceableObtainableMarket.som / 1000000).toFixed(0)}M (target)\n`);

  console.log('💼 Generating use of funds breakdown...\n');
  const useOfFunds = agent.generateUseOfFunds();
  useOfFunds.allocation.forEach(item => {
    console.log(`  ${item.category}: ${item.percentage}% ($${(item.amount / 1000).toFixed(0)}K)`);
  });

  console.log('\n🎯 Generating exit strategies...\n');
  const exits = agent.generateExitStrategies();
  exits.primaryExitPaths.forEach(exit => {
    console.log(`  ${exit.type}: ${exit.probability}, ${exit.timeline}`);
  });

  console.log('\n📋 Generating complete investment package...\n');
  const packageData = await agent.generateInvestmentPackage();

  console.log('✅ Investment package generated successfully!\n');

  // Save outputs
  console.log('💾 Saving investment package...\n');

  // Save JSON version
  const jsonPath = await agent.saveInvestmentPackage('json');
  console.log(`  JSON saved: ${jsonPath}`);

  // Save Markdown version
  const mdPath = await agent.saveInvestmentPackage('markdown');
  console.log(`  Markdown saved: ${mdPath}`);

  // Also save individual components for easy reference
  const reportsDir = path.join(process.cwd(), 'agents/reports');

  await fs.writeFile(
    path.join(reportsDir, 'financial-projections.json'),
    JSON.stringify(projections, null, 2)
  );
  console.log(`  Financial projections saved: ${path.join(reportsDir, 'financial-projections.json')}`);

  await fs.writeFile(
    path.join(reportsDir, 'cap-table.json'),
    JSON.stringify(agent.generateCapTable(), null, 2)
  );
  console.log(`  Cap table saved: ${path.join(reportsDir, 'cap-table.json')}`);

  await fs.writeFile(
    path.join(reportsDir, 'market-analysis.json'),
    JSON.stringify(market, null, 2)
  );
  console.log(`  Market analysis saved: ${path.join(reportsDir, 'market-analysis.json')}`);

  console.log('\n✅ All investment documentation generated successfully!');
  console.log('\n📖 Next steps:');
  console.log('   1. Review the generated markdown file for investor presentation');
  console.log('   2. Customize assumptions in InvestmentStrategyAgent.js as needed');
  console.log('   3. Use the JSON data to populate investor portal/dashboard');
  console.log('   4. Share with legal counsel for compliance review');
  console.log('   5. Present to potential investors\n');
}

main().catch(error => {
  console.error('❌ Error running investment agent test:', error);
  process.exit(1);
});
