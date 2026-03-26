import { ImageResponse } from 'next/og';

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          borderRadius: 8,
        }}
      >
        {/* Minimal leaf + receipt icon */}
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* Receipt shape */}
          <path d="M4 2h16v20l-4-2-4 2-4-2-4 2V2z" />
          {/* Leaf vein lines as receipt lines */}
          <path d="M8 8h8M8 12h6M8 16h4" />
        </svg>
      </div>
    ),
    { ...size }
  );
}
