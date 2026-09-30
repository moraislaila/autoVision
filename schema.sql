CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    usuario VARCHAR(100) NOT NULL,
    senha VARCHAR(6) NOT NULL,
    telefone VARCHAR(20) NOT NULL,
    foto_perfil VARCHAR(255)
);

CREATE TABLE anuncios(
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(100) NOT NULL,
    localidade VARCHAR(100) NOT NULL,
    preco NUMERIC(10,2) NOT NULL,
    imagem VARCHAR(255) NOT NULL,
    vendedor_id INTEGER NOT NULL REFERENCES usuarios(id),
    criado_em TIMESTAMP DEFAULT NOW()
);

CREATE TABLE interesses (
    id SERIAL PRIMARY KEY,
    anuncio_id INTEGER NOT NULL REFERENCES anuncios(id),
    cliente_nome VARCHAR(100) NOT NULL,
    cliente_contato VARCHAR(255) NOT NULL,
    criado_em TIMESTAMP DEFAULT NOW()
);

CREATE TABLE mensagens (
    id SERIAL PRIMARY KEY,
    anuncio_id INTEGER NOT NULL REFERENCES anuncios(id),
    cliente_nome VARCHAR(100) NOT NULL,
     cliente_contato VARCHAR(255) NOT NULL,
    criado_em TIMESTAMP DEFAULT NOW(),
    mensagem TEXT NOT NULL
);

