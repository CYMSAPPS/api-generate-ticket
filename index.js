const express = require('express');
const { createCanvas, loadImage, registerFont } = require('canvas');
const app = express();
const port = process.env.PORT || 8080;

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

        // Desenhar a imagem de fundo
        const bgImage = await loadImage(jsonData.backgroundImage);
        ctx.drawImage(bgImage, 0, 0, width, height);

        // Desenhar o texto dinâmico
        if (jsonData.text) {
            const text = jsonData.text;
            ctx.font = `${text.fontSize} '${text.fontFamily}'`;
            ctx.fillStyle = text.color;
            ctx.textBaseline = 'top';
            ctx.fillText(text.content, 82, 461); // Posição fixada de acordo com o template
        }

        // Desenhar a imagem de perfil com corte circular
        if (jsonData.profileImage) {
            const profileImage = await loadImage(jsonData.profileImage.src);
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

// Rota da API GET para gerar a imagem
app.get('/generate-image', async (req, res) => {
    try {
        const {
            backgroundImage,
            textContent,
            textColor,
            textFontSize,
            textFontFamily,
            profileImageSrc
        } = req.query;

        // Criar o JSON com base nos parâmetros da URL
        const jsonData = {
            backgroundImage: backgroundImage,
            text: {
                content: textContent || "Texto Dinâmico",
                fontSize: textFontSize || "40px",
                fontFamily: textFontFamily || "Arial",
                color: textColor || "#000000"
            },
            profileImage: {
                src: profileImageSrc || "https://example.com/profile.png"
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

