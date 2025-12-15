import { useState } from "react";
import { useAuth } from '../context/AuthContext';

const RequestPayout = ({ walletBalance }) => {
  const { user } = useAuth();
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('standard');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);
  const [error, setError] = useState(null);

  const handleRequest = async () => {
    setLoading(true);
    setError(null);
    setStatus(null);
    try {
      const res = await fetch('/.netlify/functions/api/stripe/requestPayout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid, amount: Number(amount), method })
      });
      const data = await res.json();
      if (data.payoutId) {
        setStatus(`Payout requested: ${data.status}`);
      } else {
        setError(data.error || 'Failed to request payout');
      }
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <div className="bg-gray-900 p-6 rounded-lg mb-8">
      <h3 className="text-xl mb-4">Request Payout</h3>
      <div className="space-y-4">
        <input
          type="number"
          placeholder="Amount ($)"
          value={amount}
          min={1}
          max={walletBalance}
          onChange={e => setAmount(e.target.value)}
          className="w-full p-2 rounded bg-gray-700 text-white"
        />
        <select
          value={method}
          onChange={e => setMethod(e.target.value)}
          className="w-full p-2 rounded bg-gray-700 text-white"
        >
          <option value="standard">Standard (no fee, 2 days)</option>
          <option value="instant">Instant (1.5% fee, ~30 min)</option>
        </select>
        <button
          onClick={handleRequest}
          disabled={loading || !amount || Number(amount) > walletBalance}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
        >
          {loading ? 'Processing...' : 'Request Payout'}
        </button>
        {status && <div className="text-green-400 mt-2">{status}</div>}
        {error && <div className="text-red-500 mt-2">{error}</div>}
      </div>
    </div>
  );
};

export default RequestPayout;
