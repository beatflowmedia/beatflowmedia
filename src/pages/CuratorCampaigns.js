import React from 'react';
import { useAuth } from '../context/AuthContext';

// Firestore imports
const { db } = require('../firebaseConfig');
const { collection, query, where, getDocs, doc, updateDoc } = require('firebase/firestore');

export default function CuratorCampaigns() {
  const { user } = useAuth();
  const [offers, setOffers] = React.useState([]);
  const [accepted, setAccepted] = React.useState([]);
  const [earnings, setEarnings] = React.useState(0);

  // Fetch campaigns where this curator is selected
  React.useEffect(() => {
    async function fetchOffers() {
      if (!user) return;
      const campaignsRef = collection(db, 'campaigns');
      const q = query(campaignsRef, where('curators', 'array-contains', user.uid));
      const snap = await getDocs(q);
      const campaigns = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setOffers(campaigns);
      // Calculate total earnings from accepted campaigns (example: budget split equally)
      const acceptedCampaigns = campaigns.filter(c => c.curatorStatus && c.curatorStatus[user.uid] === 'accepted');
      const total = acceptedCampaigns.reduce((sum, c) => sum + (c.budget / (c.curators?.length || 1)), 0);
      setEarnings(total);
    }
    fetchOffers();
  }, [user, accepted]);

  // Accept campaign offer
  const handleAccept = async (id) => {
    const campaignDoc = doc(db, 'campaigns', id);
    await updateDoc(campaignDoc, { [`curatorStatus.${user.uid}`]: 'accepted' });
    setAccepted([...accepted, id]);
  };

  // Decline campaign offer
  const handleDecline = async (id) => {
    const campaignDoc = doc(db, 'campaigns', id);
    await updateDoc(campaignDoc, { [`curatorStatus.${user.uid}`]: 'declined' });
    setAccepted([...accepted, id]);
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h2 className="text-3xl font-bold mb-6">Curator Campaign Offers</h2>
      <div className="bg-gray-900 p-6 rounded-lg mb-8">
        <h3 className="text-xl mb-4">Incoming Campaigns</h3>
        <table className="w-full text-white">
          <thead>
            <tr>
              <th>Artist</th>
              <th>Campaign</th>
              <th>Budget</th>
              <th>Start</th>
              <th>End</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {offers.map(c => (
              <tr key={c.id} className="border-b border-gray-700">
                <td>{c.artistId}</td>
                <td>{c.name}</td>
                <td>${c.budget}</td>
                <td>{c.startDate}</td>
                <td>{c.endDate}</td>
                <td>
                  {(!c.curatorStatus || c.curatorStatus[user.uid] !== 'accepted') && (
                    <>
                      <button onClick={() => handleAccept(c.id)} className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded mr-2">Accept</button>
                      <button onClick={() => handleDecline(c.id)} className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded">Decline</button>
                    </>
                  )}
                  {c.curatorStatus && c.curatorStatus[user.uid] === 'accepted' && <span className="text-green-400">Accepted</span>}
                  {c.curatorStatus && c.curatorStatus[user.uid] === 'declined' && <span className="text-red-400">Declined</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Earnings summary */}
      <div className="bg-gray-800 p-6 rounded-lg">
        <h3 className="text-xl mb-4">Campaign Earnings</h3>
        <p className="text-2xl text-green-400">${earnings.toFixed(2)}</p>
        <p className="text-sm text-gray-300">(Total from accepted campaigns)</p>
      </div>
    </div>
  );
}
