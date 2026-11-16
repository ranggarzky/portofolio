const express = require('express');
const { rateLimit } = require('express-rate-limit');
const path = require('path');
const cors = require("cors");
const { Client, GatewayIntentBits, Events, EmbedBuilder } = require('discord.js');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

//discord
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// Event ketika bot berhasil online
client.once(Events.ClientReady, (readyClient) => {
  console.log(`Bot berhasil online sebagai ${readyClient.user.tag}!`);
});

// Middleware untuk form & JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set('trust proxy', 1);

const limiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 2,
  message: {
    status: 429,
    success: false,
    info: 'Terlalu banyak request, Coba lagi nanti.'
  }
});

app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, 'public')));

app.use('/vendor/aos', express.static(path.join(__dirname, 'node_modules/aos/dist')));
app.use('/vendor/sweetalert2', express.static(path.join(__dirname, 'node_modules/sweetalert2/dist')));
app.use('/vendor/skeleton', express.static(path.join(__dirname, 'node_modules/placeholder-loading/dist/css')));

app.use(limiter);

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/send', async (req, res, limiter) => {
  const output_body = req.body;

  const message = new EmbedBuilder()
    .setColor("Green")
    .setTitle(`${output_body.username} | ${output_body.email}`)
    .setFields(
        { name: 'Pesan:', value: `${output_body.message}` }
    )
    .setTimestamp();
  // Validasi jika pesan kosong
  if (!message) {
    return res.status(400).json({ error: 'Pesan tidak boleh kosong!' });
  }

  try {
    // Mencari channel berdasarkan ID di .env
    const channel = await client.channels.fetch(process.env.CHANNEL_ID);
    
    if (!channel) {
      return res.status(404).json({ error: 'Channel tidak ditemukan!' });
    }

    // Bot mengirim pesan ke channel Discord
    await channel.send({
            embeds: [message]
        });

        return res.status(200).json({
            status: 200,
            success: true,
            info: 'Pesan berhasil dikirim ke Discord!'
        });

    } catch (error) {
        console.error('[DISCORD SEND ERROR]', error);

        return res.status(500).json({
            status: 200,
            success: false,
            error: 'Gagal mengirim pesan ke Discord.'
        });
    }
})

// 5. Menjalankan server
app.listen(PORT, () => {
    console.log(`[SYSTEM ONLINE] Server berjalan di http://localhost:${PORT}`);
});

client.login(process.env.BOT_TOKEN);