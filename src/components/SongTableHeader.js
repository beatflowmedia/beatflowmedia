// SongTableHeader.js
import React from "react";

const SongTableHeader = () => (
  <div className="px-6 mt-4">
    <div className="grid grid-cols-[40px_1fr_1fr_100px_60px_40px] text-gray-400 text-xs border-b border-gray-700 pb-2 mb-2">
      <div className="text-center">#</div>
      <div>Title</div>
      <div>Album</div>
      <div>Date Added</div>
      <div>Duration</div>
      <div></div>
    </div>
  </div>
);

export default SongTableHeader;
