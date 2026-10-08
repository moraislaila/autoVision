const express = require('express');
const { Pool } = require('pg');
// const multer = require('multer');
// const path = require('path');

const app = express();
app.use(express.json());

const storage = multer.diskStorage(
    {
        destination: "public/uploads",
        filename: (req, file, cb) => {
            cb(null, Date.now() + path.extname(file.originalname))
        }
    }
)

const upload = multer({ storage })

const pool = new Pool({
    user: 'postgres',
    password: 'senai',
    host: 'localhost',
    port: 5432,
    database: 'autovision2',
});

app.get('/api/anuncios', async (req, res) => {
    try {
        const { modelo } = req.query;
        const params = [];

        let query = `
      SELECT a.id, a.titulo, a.local, a.preco, a.imagem,
             u.nome AS vendedor, 
             u.usuario AS vendedor_usuario, 
             u.telefone AS vendedor_telefone,
             COUNT(i.id)::int AS interesses
      FROM anuncios a
      JOIN usuarios u ON u.id = a.vendedor_id
      LEFT JOIN interesses i ON i.anuncio_id = a.id
    `;

        if (modelo) {
            params.push(`%${modelo}%`);
            query += ` WHERE a.titulo ILIKE $${params.length}`;
        }

        query += ` GROUP BY a.id, u.nome, u.usuario, u.telefone 
      ORDER BY a.criado_em DESC`;

        const { rows } = await pool.query(query, params);
        res.json(rows);
    } catch (error) {
        // Isso vai mostrar no seu terminal do VS Code qual é o erro real do banco!
        console.error('--- ERRO DETECTADO NO BANCO ---');
        console.error(error.message);
        res.status(500).json({ erro: error.message });
    }
});

// ROTA DE LOGIN
app.post('/api/login', async (req, res) => {
    const { usuario, senha } = req.body;

    const { rows } = await pool.query(
        `SELECT id, nome, usuario, telefone, foto_perfil
     FROM usuarios
     WHERE usuario = $1 AND senha = $2`,
        [usuario, senha],
    );

    if (rows.length === 0) {
        return res.status(401).json({ erro: 'Usuário ou senha incorreta' });
    }

    res.json(rows[0]);
});

// ROTA DE INTERESSE
app.post('/api/interesses/:anuncioId', async (req, res) => {
    const { anuncioId } = req.params;
    const { cliente_nome, cliente_contato } = req.body;

    if (!cliente_nome || !cliente_contato) {
        return res.status(400).json({ erro: 'Nome e contato inválidos' });
    }

    await pool.query(
        `INSERT INTO interesses (anuncio_id, cliente_nome, cliente_contato)
     VALUES ($1, $2, $3)`,
        [anuncioId, cliente_nome, cliente_contato],
    );

    const { rows } = await pool.query(
        `SELECT COUNT(*)::int AS total FROM interesses
     WHERE anuncio_id = $1`,
        [anuncioId],
    );

    res.json({ interesses: rows[0].total });
});

// PERFIL
app.get('/api/perfil/:id', async (req, res) => {
    const { id } = req.params;
    const anuncios = await pool.query(
        ` SELECT a.id, a.titulo, a.local, a.preco, a.imagem, a.criado_em,
    COUNT(i.id)::int AS interesses
    FROM anuncios a LEFT JOIN interesses i 
    ON i.anuncio_id = a.id
    WHERE a.vendedor_id = $1 GROUP BY a.id ORDER BY a.criado_em DESC 
    `,
        [id],
    );

    const totalInteresses = anuncios.rows.reduce((acc, a) => {
        return acc + a.interesses;
    }, 0);

    res.json({
        totalAnuncios: anuncios.rows.length,
        totalInteresses,
        anuncios: anuncios.rows,
    });
});

//ENVIAR MENSAGEM
app.post('/api/mensagens/:anuncioId', async (req, res) => {
    const { anuncioId } = req.params;
    const { cliente_nome, cliente_contato, mensagem } = req.body;

    if (!cliente_nome || !cliente_contato || !mensagem) {
        return res
            .status(400)
            .json({ erro: 'Nome, contato e mensagem são obrigatórios' });
    }

    await pool.query(
        `
    INSERT INTO mensagens (anuncio_id, cliente_nome, cliente_contato, mensagem)
    VALUES ($1, $2, $3, $4)`,
        [anuncioId, cliente_nome, cliente_contato, mensagem],
    );

    res.json({ ok: true });
});

app.post('/api/anuncios', upload.single("imagem"), async (req, res) => {
    const { titulo, local, preco, vendedor_id } = req.body

    if (!req.file) return res.status(400).json({ erro: "imagem obrigatória" })

    const { rows } = await pool.query(" INSERT INTO anuncios (titulo, localidade, preco, imagem, vendedor_id) VALUES ($1, $2, $3, $4, $5) RETURNING")
    [titulo, local, preco, req.file.filename, vendedor_id]

    return res.status(201).json({ mensagem: "anuncio criado", anuncio: rows[0] })
})

// ENDPOINT de remoção de anuncio
app.delete('/api/anuncios/:id', async (req, res) => {
    const { id } = req.params 

    const { rows } = await pool.query("DELETE FROM anuncios WHERE id = $1 RETURNING", [id])

    return res.status(200).json({ok: "Anuncio excluido", anuncio: rows})
})

app.listen(3000, () =>
    console.log('Servidor rodando em http://localhost:3000'),
);
