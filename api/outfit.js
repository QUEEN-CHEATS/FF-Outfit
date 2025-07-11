import { createCanvas, loadImage } from 'canvas';
import fetch from 'node-fetch';

export default async function handler(req, res) {
  const { uid, regin } = req.query;
  
  // පරාමිතීන් තහවුරු කිරීම
  if (!uid || !regin) {
    return res.status(400).json({ error: 'Missing uid or regin' });
  }

  try {
    // පියවර 1: ක්‍රීඩක තොරතුරු ගැනීම (timeout සමග)
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    
    const apiRes = await fetch(
      `https://free-fire-info-site-phi.vercel.app/player-info?region=${regin}&uid=${uid}`,
      { signal: controller.signal }
    );
    clearTimeout(timeout);

    const data = await apiRes.json();
    const avatarId = data?.profileInfo?.avatarId;
    const clothes = data?.profileInfo?.clothes?.slice(0, 6);

    if (!avatarId || !clothes?.length) {
      return res.status(404).json({ error: 'Invalid profile info' });
    }

    // පියවර 2: canvas නිර්මාණය කිරීම
    const canvas = createCanvas(800, 800);
    const ctx = canvas.getContext('2d');

    // පසුබිම සුදු පැහැයෙන් පුරවන්න
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // පියවර 3: අවතාරය පූරණය කිරීම සහ ඇඳීම
    try {
      const avatarImg = await loadImage(`https://ff.garena.com/images/avatars/${avatarId}.png`);
      ctx.drawImage(avatarImg, 200, 150, 400, 500);
    } catch (err) {
      console.error('Avatar load error:', err);
      return res.status(404).json({ error: 'Avatar template not found' });
    }

    // පියවර 4: ඇඳුම් ඇඳීම
    const positions = [
      [100, 100], [600, 100],
      [100, 350], [600, 350],
      [100, 600], [600, 600],
    ];

    await Promise.all(
      clothes.slice(0, positions.length).map(async (itemId, i) => {
        try {
          const itemImg = await loadImage(`https://ff.garena.com/images/items/${itemId}.png`);
          const [x, y] = positions[i];
          ctx.drawImage(itemImg, x, y, 100, 100);
        } catch (err) {
          console.log(`Item ${itemId} not found`);
        }
      })
    );

    // පියවර 5: cache headers සකස් කිරීම (මිනිත්තු 1 cache)
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=60');
    res.setHeader('CDN-Cache-Control', 'max-age=60');
    res.setHeader('Vercel-CDN-Cache-Control', 'max-age=60');
    
    // පින්තූරය stream කිරීම
    canvas.createPNGStream().pipe(res);

  } catch (error) {
    console.error('Error generating outfit:', error);
    if (error.name === 'AbortError') {
      return res.status(504).json({ error: 'Request timeout' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
}
