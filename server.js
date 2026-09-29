const express = require('express');
const { Pool } = require('pg');
const multer = require('multer');
const path = require('path');

const app = express();
app.use(express.json());

const pool = new Pool({
    user: 'postgres',
    password: 'Senai1510',
    host: 'localhost',
    port: 5432,
    database: 'autoVision'
})

app.get('/api/anuncios', async (req, res) => {
    const { modelo } = req.query;
    const params = [];

    let query = `
    SELECT a.id_usuario, a.titulo, a.localidade, a.preco, a.imagem, a.vendedor_id, a.criado_em
        u.nome AS vendedor, 
        u.usuario AS vendedor_usuario,
        u.telefone AS vendedor_telefone,
        COUNT(i.id_interesse):: int AS interesses
    FROM anuncios a 
    JOIN usuarios u ON u.id_usuario = a.vendedor_id
    LEFT JOIN interresses i ON i.anuncio_id = a.id_anuncio
    `;

    if (modelo) {
        params.push(`%${modelo}$%`)
        query += `WHERE a.titulo ILIKE $${params.length}`
    }

    query =+ '
    GROUP BY a.id_usuario, u.nome, u.usuario, u.telefone, ORDER BY a.criado_em DESC
    ;

    const { rows } = await pool.query(query, params);
    res.json(rows)
});

app.listen(3000, () =>
    console.log('servidor rodando em http://localhost:3000'),
);