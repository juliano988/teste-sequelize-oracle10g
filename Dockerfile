FROM node:18-slim

# Instalar dependências do sistema
RUN apt-get update && apt-get install -y \
    wget \
    unzip \
    libaio1 \
    && rm -rf /var/lib/apt/lists/*

# Baixar e instalar Oracle Instant Client
RUN mkdir -p /opt/oracle
WORKDIR /opt/oracle

RUN wget https://download.oracle.com/otn_software/linux/instantclient/instantclient-basiclite-linuxx64.zip \
    && unzip instantclient-basiclite-linuxx64.zip \
    && rm instantclient-basiclite-linuxx64.zip

# Configurar variáveis de ambiente do Oracle
ENV LD_LIBRARY_PATH=/opt/oracle/instantclient_21_12:$LD_LIBRARY_PATH
ENV PATH=/opt/oracle/instantclient_21_12:$PATH

# Configurar diretório da aplicação
WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar dependências
RUN npm install

# Copiar código da aplicação
COPY . .

# Expor porta
EXPOSE 3000

# Comando para iniciar a aplicação
CMD ["npm", "start"]
