const express = require('express');
const { createCanvas, loadImage, registerFont, Image } = require('canvas');
const app = express();
const port = process.env.PORT || 8080;

// Middleware para aceitar JSON no corpo da requisição
app.use(express.json({ limit: '10mb' })); // Ajuste o limite conforme necessário

// Registre as fontes com os caminhos relativos à pasta 'fonts'
registerFont('./fonts/arial.ttf', { family: 'Arial' });
registerFont('./fonts/OpenSans-SemiBold.ttf', { family: 'OpenSans-SemiBold' });
registerFont('./fonts/times-new-roman.ttf', { family: 'Times New Roman' });
registerFont('./fonts/verdana.ttf', { family: 'Verdana' });

async function generateImage(jsonData) {
    try {
        // Defina o tamanho do canvas fixo de acordo com o template frontend
        const width = 442.25;
        const height = 753;
        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext('2d');

        // Limpar o canvas
        ctx.clearRect(0, 0, width, height);

        // Desenhar a imagem de fundo a partir do base64
        const bgImage = new Image();
        bgImage.src = jsonData.backgroundImage;
        ctx.drawImage(bgImage, 0, 0, width, height);

        // Desenhar o nome do usuário centralizado
        if (jsonData.text) {
            const text = jsonData.text;
            ctx.font = `${text.fontSize} '${text.fontFamily}'`;
            ctx.fillStyle = text.color;
            ctx.textAlign = 'center'; // Centraliza o texto
            ctx.textBaseline = 'top';
            ctx.fillText(text.content, width / 2, 461); // Centraliza o texto na largura da imagem
        }

        // Desenhar a imagem de perfil com corte circular
        if (jsonData.profileImage) {
            const profileImage = new Image();
            profileImage.src = jsonData.profileImage.src;
            const profileX = 86;
            const profileY = 148;
            const profileSize = 272; // Tamanho fixo de acordo com o template

            // Cortar a imagem como círculo
            ctx.save();
            ctx.beginPath();
            ctx.arc(profileX + profileSize / 2, profileY + profileSize / 2, profileSize / 2, 0, Math.PI * 2);
            ctx.closePath();
            ctx.clip();

            // Desenhar a imagem dentro do círculo
            ctx.drawImage(profileImage, profileX, profileY, profileSize, profileSize);
            ctx.restore();
        }

        // Converter para Buffer de imagem
        const buffer = canvas.toBuffer('image/png');
        return buffer;
    } catch (error) {
        throw new Error(`Erro ao gerar a imagem: ${error.message}`);
    }
}

// Rota da API POST para gerar a imagem
app.post('/generate-image', async (req, res) => {
    try {
        const { backgroundImage, text, profileImage } = req.body;

        // Criar o JSON com base nos dados do corpo da requisição
        const jsonData = {
            backgroundImage: backgroundImage,
            text: text || {
                content: "Texto Dinâmico",
                fontSize: "40px",
                fontFamily: "Arial",
                color: "#000000"
            },
            profileImage: profileImage || {
                src: "https://example.com/profile.png"
            }
        };

        // Gerar a imagem
        const buffer = await generateImage(jsonData);

        // Definir o tipo de resposta como imagem PNG
        res.setHeader('Content-Type', 'image/png');
        res.send(buffer);
    } catch (err) {
        console.error(`Erro ao processar a requisição: ${err.message}`);
        res.status(500).json({ error: err.message });
    }
});

app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});


