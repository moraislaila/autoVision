const express = require('express');
const { Pool } = require('pg');
const multer = require('multer');
const path = require('path');

const app = express();
app.use(express.json());

const pool = new Pool({
    user: 'postgres',
    password: 'senai',
    host: 'localhost',
    port: 5432,
    database: 'autoVision'
})

app.get('/api/anuncios', async (req, res) => {
    const { modelo } = req.query;
    const params = [];

    let query = `
    SELECT a.id, a.titulo, a.localidade, a.preco, a.imagem, a.vendedor_id, a.criado_em,
        u.nome AS vendedor, 
        u.usuario AS vendedor_usuario,
        u.telefone AS vendedor_telefone,
        COUNT(i.id):: int AS interesses
    FROM anuncios a 
    JOIN usuarios u ON u.id = a.vendedor_id
    LEFT JOIN interesses i ON i.anuncio_id = a.id
    `;

    if (modelo) {
        params.push(`%${modelo}$%`)
        query += `WHERE a.titulo ILIKE $${params.length}`;
    }

    query += `
    GROUP BY a.id, u.nome, u.usuario, u.telefone ORDER BY a.criado_em DESC`;

    const { rows } = await pool.query(query, params);
    res.json(rows)
});

//rota de login
app.post('/api/login', async (req, res) => {
    const { usuario, senha } = req.body;
    const { rows } = await pool.query(
        ` SELECT id, nome, usuario, telefone, foto_perfil
        FROM usuarios 
        WHERE usuario = $1 AND senha = $2`,
        [usuario, senha]
    );

    if (rows.length === 0) {
        return res.status(401).json({ erro: 'Usuário ou senha incorreta' })
    }
    res.json(rows[0])
})

//ROTA DE INTERESSE
app.post("/api/interesses/:anuncioID", async (req, res) => {
    const { anuncioID } = req.params;
    const { cliente_nome, cliente_contato } = req.body;

    if (!cliente_nome || !cliente_contato) {
        return res.status(400).json({ erro: 'Nome e contato inválidos' })
    }

    await pool.query(
        `INSERT INTO interesses (anuncio_id, cliente_nome, cliente_contato)
        VALUES ($1, $2, $3)`,
        [anuncioID, cliente_nome, cliente_contato],
    );

    const { rows } = await pool.query(
        `SELECT COUNT(*)::int AS total FROM interesses
        WHERE anuncios_id = $1 `,
        [anuncioID]
    );

    res.json({ interesses: rows[0].total });
})

//perfil
app.get('/api/perfil/:id', async (req, res) => {
    const { id } = req.params;
    const anuncios = await pool.query(
        `SELECT a.id, a.titulo, a.local, a.preco, a.imagem, a.criado_em,
        COUNT(i.id)::int AS interesses 
        FROM anuncios a LEFT JOIN interesses i 
        ON i.anuncio_id = a.id
        WHERE a.vendedor = $1 GROUP BY a.id ORDER BY a.criado_em DESC`,
        [id],
    )

    const totalInteresses = anuncios.rows.reduce((acc, a) => {
        return acc + a.interesses;
    }, 0);

    res.json({
        totalAnuncios: anuncios.rows.length,
        totalInteresses,
        anuncios: anuncios.rows
    })
})

//ENVIAR MENSSAGEM
app.post('/api/mensagens/:anuncioId', async (req, res) => {
    const { anuncioId } = req.params;
    const { cliente_nome, cliente_contato, mensagem } = req.body;

    if (!cliente_nome || !cliente_contato || !mensagem)
        return res
            .status(400)
            .json({ erro: 'Nome, contato e menssagem são obrigatórias' })
})

 await pool.query(
    `INSERT INTO mensagens (anuncio_id, cliente_nome, cliente_contato, mensagem)
    VALUES ($1, $2, $3, $4)`,
    [anunciosId, cliente_nome, cliente_contato, mensagem]
 )

app.listen(3000, () =>
    console.log('servidor rodando em http://localhost:3000'),
);