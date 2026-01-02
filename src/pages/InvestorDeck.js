import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { db } from '../firebaseConfig';
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';
import Footer from '../components/Footer';
import investmentData from '../../agents/reports/investment-package-2026-01-02.json';

export default function InvestorDeck() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tokenData, setTokenData] = useState(null);

  useEffect(() => {
    validateToken();
  }, [token]);

  const validateToken = async () => {
    if (!token) {
      setError('No access token provided');
      setLoading(false);
      return;
    }

    try {
      const tokenRef = doc(db, 'investorTokens', token);
      const tokenSnap = await getDoc(tokenRef);

      if (!tokenSnap.exists()) {
        setError('Invalid access token');
        setLoading(false);
        return;
      }

      const data = tokenSnap.data();
      const now = new Date();
      const expiresAt = data.expiresAt.toDate();

      if (now > expiresAt) {
        setError('This link has expired. Please request a new access link.');
        setLoading(false);
        return;
      }

      // Update access tracking
      await updateDoc(tokenRef, {
        accessed: true,
        accessCount: increment(1),
        lastAccessedAt: new Date()
      });

      setTokenData(data);
      setLoading(false);
    } catch (err) {
      console.error('Token validation error:', err);
      setError('Failed to validate access token');
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatNumber = (num) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
    return num.toString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-bf-green mx-auto mb-4"></div>
          <p className="text-white">Validating access...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="max-w-md mx-auto text-center p-8">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-white mb-4">Access Denied</h1>
          <p className="text-gray-400 mb-6">{error}</p>
          <Link
            to="/investors"
            className="inline-block bg-bf-green text-black font-semibold px-6 py-3 rounded-full hover:bg-green-600 transition"
          >
            Request New Access
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 py-6 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-bf-green">BeatFlow Media Group</h1>
              <p className="text-gray-400 text-sm mt-1">Investment Opportunity - Confidential</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-400">Access granted to:</p>
              <p className="text-white font-semibold">{tokenData?.email}</p>
              <p className="text-xs text-gray-500 mt-1">
                Expires: {tokenData?.expiresAt.toDate().toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        {/* Executive Summary */}
        <section className="mb-12">
          <h2 className="text-4xl font-bold mb-6">Executive Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
              <div className="text-bf-green text-sm font-semibold mb-2">Seeking</div>
              <div className="text-3xl font-bold">$1M</div>
              <div className="text-gray-400 text-sm mt-1">Seed Round</div>
            </div>
            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
              <div className="text-bf-green text-sm font-semibold mb-2">Valuation</div>
              <div className="text-3xl font-bold">$4M</div>
              <div className="text-gray-400 text-sm mt-1">Pre-money</div>
            </div>
            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
              <div className="text-bf-green text-sm font-semibold mb-2">Year 1 Revenue</div>
              <div className="text-3xl font-bold">$3.8M</div>
              <div className="text-gray-400 text-sm mt-1">Projected</div>
            </div>
            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
              <div className="text-bf-green text-sm font-semibold mb-2">Target Exit</div>
              <div className="text-3xl font-bold">$25-75M</div>
              <div className="text-gray-400 text-sm mt-1">3-5 years</div>
            </div>
          </div>
        </section>

        {/* Financial Projections */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6">5-Year Financial Projections</h2>
          <div className="bg-gray-800 rounded-lg overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-700">
                <tr>
                  <th className="px-6 py-4 text-left">Year</th>
                  <th className="px-6 py-4 text-right">Revenue</th>
                  <th className="px-6 py-4 text-right">Net Income</th>
                  <th className="px-6 py-4 text-right">Margin</th>
                  <th className="px-6 py-4 text-right">Users</th>
                  <th className="px-6 py-4 text-right">Artists</th>
                </tr>
              </thead>
              <tbody>
                {investmentData.financialProjections?.yearlyProjections.map((year, idx) => (
                  <tr key={idx} className="border-t border-gray-700">
                    <td className="px-6 py-4 font-semibold">Year {year.year}</td>
                    <td className="px-6 py-4 text-right">{formatCurrency(year.totalRevenue)}</td>
                    <td className="px-6 py-4 text-right">{formatCurrency(year.netIncome)}</td>
                    <td className="px-6 py-4 text-right text-bf-green">{year.profitMargin.toFixed(1)}%</td>
                    <td className="px-6 py-4 text-right">{formatNumber(year.users.premiumSubscribers)}</td>
                    <td className="px-6 py-4 text-right">{formatNumber(year.artists)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Investment Tiers */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6">Investment Tiers</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {investmentData.investmentStructure?.tiers.map((tier, idx) => (
              <div key={idx} className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                <h3 className="text-2xl font-bold mb-3 text-bf-green">{tier.name}</h3>
                <div className="mb-4">
                  <span className="text-gray-400">Investment Range: </span>
                  <span className="font-semibold">{tier.range}</span>
                </div>
                <div className="mb-4">
                  <span className="text-gray-400">Equity: </span>
                  <span className="font-semibold">{tier.equity}</span>
                </div>
                <div className="mb-4">
                  <div className="text-sm font-semibold text-gray-300 mb-2">ROI Examples:</div>
                  {tier.roiExamples && Object.entries(tier.roiExamples).map(([scenario, data]) => (
                    <div key={scenario} className="text-sm text-gray-400 mb-1">
                      {scenario}: <span className="text-bf-green font-semibold">{data.multiple}</span> = {formatCurrency(data.return)}
                    </div>
                  ))}
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-300 mb-2">Perks:</div>
                  <ul className="text-sm text-gray-400 space-y-1">
                    {tier.perks?.map((perk, i) => (
                      <li key={i}>• {perk}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Use of Funds */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6">Use of Funds</h2>
          <div className="bg-gray-800 p-6 rounded-lg">
            {investmentData.useOfFunds?.allocation.map((item, idx) => (
              <div key={idx} className="mb-6 last:mb-0">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-xl font-semibold">{item.category}</h3>
                  <span className="text-bf-green font-bold">{item.percentage}% - {formatCurrency(item.amount)}</span>
                </div>
                <p className="text-gray-400 text-sm mb-3">{item.description}</p>
                <div className="bg-gray-700 rounded-full h-2 mb-2">
                  <div
                    className="bg-bf-green h-2 rounded-full"
                    style={{ width: `${item.percentage}%` }}
                  ></div>
                </div>
                {item.breakdown && (
                  <ul className="text-sm text-gray-400 ml-4 mt-2 space-y-1">
                    {item.breakdown.map((detail, i) => (
                      <li key={i}>• {detail}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Market Opportunity */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6">Market Opportunity</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-gray-800 p-6 rounded-lg text-center">
              <div className="text-4xl font-bold text-bf-green mb-2">$8.5B</div>
              <div className="text-gray-400 text-sm">TAM</div>
              <div className="text-gray-500 text-xs mt-2">Total Addressable Market</div>
            </div>
            <div className="bg-gray-800 p-6 rounded-lg text-center">
              <div className="text-4xl font-bold text-bf-green mb-2">$2.5B</div>
              <div className="text-gray-400 text-sm">SAM</div>
              <div className="text-gray-500 text-xs mt-2">Serviceable Addressable Market</div>
            </div>
            <div className="bg-gray-800 p-6 rounded-lg text-center">
              <div className="text-4xl font-bold text-bf-green mb-2">$50M</div>
              <div className="text-gray-400 text-sm">SOM</div>
              <div className="text-gray-500 text-xs mt-2">Serviceable Obtainable Market</div>
            </div>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-4">Competitive Advantages</h3>
            <ul className="space-y-2 text-gray-300">
              {investmentData.marketAnalysis?.competitiveAdvantages.map((advantage, idx) => (
                <li key={idx} className="flex items-start">
                  <span className="text-bf-green mr-2">✓</span>
                  <span>{advantage}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Exit Strategy */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6">Exit Strategy</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {investmentData.exitStrategy?.scenarios.map((scenario, idx) => (
              <div key={idx} className="bg-gray-800 p-6 rounded-lg">
                <h3 className="text-xl font-semibold mb-2">{scenario.type}</h3>
                <div className="text-sm text-gray-400 mb-4">Probability: <span className="text-bf-green">{scenario.probability}</span></div>
                <div className="space-y-2 text-sm">
                  <div><span className="text-gray-400">Timeline:</span> {scenario.timeline}</div>
                  <div><span className="text-gray-400">Multiple:</span> {scenario.expectedMultiple}</div>
                  {scenario.valuationRange && (
                    <div><span className="text-gray-400">Valuation:</span> {scenario.valuationRange}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Risks */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6">Key Risks & Mitigation</h2>
          <div className="space-y-4">
            {investmentData.risks?.categories.flatMap(cat =>
              cat.risks.map((risk, idx) => (
                <div key={`${cat.category}-${idx}`} className="bg-gray-800 p-6 rounded-lg border-l-4 border-yellow-600">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-semibold">{risk.name}</h3>
                    <span className={`text-xs px-2 py-1 rounded ${
                      risk.severity === 'High' ? 'bg-red-900 text-red-200' :
                      risk.severity === 'Medium' ? 'bg-yellow-900 text-yellow-200' :
                      'bg-green-900 text-green-200'
                    }`}>{risk.severity}</span>
                  </div>
                  <p className="text-gray-400 text-sm mb-3">{risk.description}</p>
                  <div className="text-sm">
                    <span className="text-gray-500">Mitigation: </span>
                    <span className="text-gray-300">{risk.mitigation}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Legal Disclaimers */}
        <section className="bg-gray-800 p-6 rounded-lg border border-yellow-600">
          <h2 className="text-xl font-bold mb-4 text-yellow-400">⚠️ Legal Disclaimers</h2>
          <ul className="text-xs text-gray-400 space-y-2">
            {investmentData.legalDisclaimers?.disclaimers.map((disclaimer, idx) => (
              <li key={idx}>• {disclaimer}</li>
            ))}
          </ul>
        </section>

        {/* Contact */}
        <section className="mt-12 text-center">
          <h2 className="text-2xl font-bold mb-4">Ready to Invest?</h2>
          <p className="text-gray-400 mb-6">Contact us to discuss investment terms and next steps.</p>
          <a
            href="mailto:office@beatflowmediagroup.com?subject=Investment Inquiry"
            className="inline-block bg-bf-green text-black font-semibold px-8 py-4 rounded-full hover:bg-green-600 transition text-lg"
          >
            Schedule a Call
          </a>
        </section>
      </main>

      <Footer />
    </div>
  );
}
