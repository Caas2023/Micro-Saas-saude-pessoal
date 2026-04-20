# 🩺 Saúde Pessoal — Monitoramento Clínico Inteligente

![Banner](https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=2070)

O **Saúde Pessoal** é uma plataforma premium de monitoramento evolutivo de saúde, projetada para transformar dados laboratoriais estáticos em insights visuais poderosos. Utilizando Inteligência Artificial de ponta, o sistema automatiza a extração de dados de exames físicos (fotos/PDFs) e permite o acompanhamento histórico de marcadores biológicos.

---

## ✨ Funcionalidades Principais

*   **🔍 OCR Clínico de Alta Precisão**: Extração automática de marcadores, valores e unidades a partir de fotos de exames usando Google Gemini 1.5 Pro.
*   **📈 Gráficos de Evolução**: Visualize a tendência histórica de colesterol, glicose, vitaminas e qualquer outro marcador extraído.
*   **🛡️ Segurança e Privacidade**: Implementação robusta com Supabase Auth e Row Level Security (RLS) para garantir que seus dados médicos sejam apenas seus.
*   **🔌 Ecossistema BYOP (Bring Your Own Provider)**: Liberdade total para conectar suas próprias chaves de API.
*   **📊 Monitoramento Delta**: Cálculo automático de variação percentual em relação ao exame anterior.

---

## 🐝 Integração Pollinations & BYOP

<p align="center">
  <a href="https://pollinations.ai">
    <img src="https://pollinations.ai/pollinations_logo_text_white.png" alt="Pollinations.ai Logo" width="200" />
  </a>
</p>
<p align="center">
  <a href="https://pollinations.ai">
    <img src="https://img.shields.io/badge/Built%20With-pollinations.ai-black?style=for-the-badge&logoUrl=https%3A%2F%2Fpollinations.ai%2Ffavicon.ico" alt="Built With pollinations.ai" />
  </a>
</p>

O Saúde Pessoal nasceu com a filosofia de **Soberania de Dados e IA**. Através do sistema **BYOP (Bring Your Own Provider)**, você pode:

1.  **Pollinations AI**: Conectar sua conta [Pollinations.ai](https://pollinations.ai) via OAuth para utilizar créditos descentralizados e modelos alternativos.
2.  **Multi-Provider**: Configurar chaves privadas da **OpenAI**, **Anthropic** ou sua própria chave **Gemini** diretamente nas configurações do painel.
3.  **Privacidade Local**: Suas chaves BYOP são armazenadas apenas no seu navegador (`localStorage`), garantindo que nem mesmo os administradores do sistema tenham acesso a elas.

---

## 🛠️ Guia de Instalação

Se você deseja rodar uma instância local do Saúde Pessoal, siga os passos abaixo:

### 1. Pré-requisitos
*   [Node.js](https://nodejs.org/) (v18+)
*   Conta no [Supabase](https://supabase.com/)
*   Chave de API do [Google AI Studio](https://aistudio.google.com/) (Gemini)

### 2. Clonagem e Dependências
```bash
git clone https://github.com/seu-usuario/saude-pessoal.git
cd saude-pessoal
npm install
```

### 3. Configuração do Banco de Dados (Supabase)
Execute os scripts SQL localizados na raiz do projeto no seu editor SQL do Supabase:
1.  Rode `supabase_schema.sql` para criar tabelas, enums e políticas de segurança.
2.  Rode `supabase_setup.sql` (se houver) para configurações adicionais.

### 4. Variáveis de Ambiente
Crie um arquivo `.env` na raiz com as seguintes chaves:
```env
VITE_SUPABASE_URL=https://sua-url-do-supabase.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon-key
VITE_GEMINI_API_KEY=sua-chave-gemini
```

### 5. Execução
```bash
npm run dev
```

---

## 📂 Estrutura do Projeto

*   `/src/components`: Componentes de UI (usando Radix UI + Framer Motion).
*   `/src/contexts`: Gerenciamento de estado global e configurações de IA.
*   `/src/services`: Lógica de integração com Vision API e Supabase Storage.
*   `/src/hooks`: Hooks customizados para Queries e Mutations com TanStack Query.
*   `/supabase_schema.sql`: Definição completa do banco de dados e políticas RLS.

---

## 📝 Licença

Este projeto é de uso pessoal e educacional. Siga as diretrizes de privacidade de dados médicos do seu país ao realizar o deploy.

---
> 🤖 **Saúde Pessoal** — *Sua saúde, seus dados, sua inteligência.*
