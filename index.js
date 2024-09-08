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
        const bgImage = await loadImage(jsonData.backgroundImage);

        // Dimensões da imagem de fundo
        const width = bgImage.width;
        const height = bgImage.height;

        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext('2d');

        // Limpar o canvas
        ctx.clearRect(0, 0, width, height);

        // Desenhar a imagem de fundo
        ctx.drawImage(bgImage, 0, 0, width, height);

        // Desenhar o texto
        if (jsonData.text) {
            const text = jsonData.text;
            ctx.font = `${text.fontSize} '${text.fontFamily}'`; // Usa a fonte dinâmica
            ctx.fillStyle = text.color;
            ctx.textBaseline = 'top'; // Para que o posicionamento do texto seja mais previsível
            ctx.fillText(text.content, parseInt(text.position.left), parseInt(text.position.top));
        }

        // Desenhar a imagem de perfil
        if (jsonData.profileImage) {
            const profileImage = await loadImage(jsonData.profileImage.src);
            const profileX = parseInt(jsonData.profileImage.position.left);
            const profileY = parseInt(jsonData.profileImage.position.top);
            const profileWidth = parseInt(jsonData.profileImage.size.width);
            const profileHeight = parseInt(jsonData.profileImage.size.height);

            // Cortar a imagem como círculo
            ctx.save(); // Salva o estado do canvas
            ctx.beginPath();
            ctx.arc(profileX + profileWidth / 2, profileY + profileHeight / 2, profileWidth / 2, 0, Math.PI * 2);
            ctx.closePath();
            ctx.clip(); // Define a área de corte circular

            // Desenha a imagem dentro do círculo
            ctx.drawImage(profileImage, profileX, profileY, profileWidth, profileHeight);
            ctx.restore(); // Restaura o estado do canvas, permitindo o desenho fora da área de corte
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
            textPositionTop,
            textPositionLeft,
            profileImageSrc,
            profileImagePositionTop,
            profileImagePositionLeft,
            profileImageWidth,
            profileImageHeight
        } = req.query;

        // Verifique se os parâmetros essenciais estão presentes
        if (!backgroundImage) {
            return res.status(400).json({ error: "O parâmetro 'backgroundImage' é obrigatório." });
        }

        // Criar o JSON com base nos parâmetros da URL
        const jsonData = {
            backgroundImage: backgroundImage,
            text: {
                content: textContent || "Texto Dinâmico",
                fontSize: textFontSize || "24px",
                fontFamily: textFontFamily || "Arial",
                color: textColor || "#000000",
                position: {
                    top: textPositionTop || "100px",
                    left: textPositionLeft || "50px"
                }
            },
            profileImage: {
                src: profileImageSrc || "https://example.com/profile.png",
                position: {
                    top: profileImagePositionTop || "200px",
                    left: profileImagePositionLeft || "300px"
                },
                size: {
                    width: profileImageWidth || "100",
                    height: profileImageHeight || "100"
                }
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

