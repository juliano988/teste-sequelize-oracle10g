FROM node:18-slim

# Instalar dependências do sistema
RUN apt-get update && apt-get install -y \
    wget \
    unzip \
    libaio1 \
    libaio-dev \
    && rm -rf /var/lib/apt/lists/*

# Baixar e instalar Oracle Instant Client
RUN mkdir -p /opt/oracle
WORKDIR /opt/oracle

# Baixar Oracle Instant Client Basic
RUN wget https://download.oracle.com/otn_software/linux/instantclient/1912000/instantclient-basic-linux.x64-19.12.0.0.0dbru.zip \
    && unzip instantclient-basic-linux.x64-19.12.0.0.0dbru.zip \
    && rm instantclient-basic-linux.x64-19.12.0.0.0dbru.zip

# Configurar variáveis de ambiente do Oracle
ENV ORACLE_HOME=/opt/oracle/instantclient_19_12
ENV LD_LIBRARY_PATH=$ORACLE_HOME:$LD_LIBRARY_PATH
ENV PATH=$ORACLE_HOME:$PATH

# Criar links simbólicos necessários
RUN cd $ORACLE_HOME && \
    ln -sf libclntsh.so.19.1 libclntsh.so && \
    ln -sf libocci.so.19.1 libocci.so

# Configurar diretório da aplicação
WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./
COPY tsconfig.json ./

# Instalar dependências
RUN npm install

# Copiar código da aplicação
COPY src/ ./src/

# Compilar TypeScript
RUN npm run build

# Expor porta
EXPOSE 3000

# Comando para iniciar a aplicação
CMD ["npm", "run", "start:dev"]
