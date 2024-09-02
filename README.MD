### Projeto de Microserviços para Plataforma de Streaming de Música

## Visão Geral
Este projeto é um sistema de microserviços desenvolvido para uma plataforma de streaming de música. O foco está na integração entre serviços e no processamento assíncrono de eventos. A arquitetura foi inspirada no Moleculer.js, especialmente na estrutura do gateway.

## Arquitetura do Sistema
### Microserviços
API Gateway

Redireciona as requisições para os microserviços apropriados.
Implementa autenticação via middleware que analisa o token JWT.
Utiliza Circuit Breaker (opossum) para garantir resiliência nas chamadas entre serviços.
Playlist Service

Gerencia playlists de usuários através de uma API RESTful.
Publica eventos de criação/atualização de playlists no RabbitMQ.
Utiliza MongoDB para armazenamento.
Analysis Service

Processa eventos de playlist recebidos do RabbitMQ.
Atualiza estatísticas de usuários (como contagem de playlists).
Utiliza Redis para caching curto de consultas de análise.
Auth Service

Gerencia a autenticação dos usuários.
Gera e valida tokens JWT.

### Integração
RabbitMQ: Usado para comunicação assíncrona entre os serviços. Eventos de playlist são publicados pelo playlist-service e consumidos pelo analysis-service.
Redis: Implementado no analysis-service para caching de curto prazo, evitando consultas repetidas desnecessárias.
Docker: Os microserviços, RabbitMQ, e ferramentas de monitoramento são containerizados utilizando Docker e gerenciados pelo Docker Compose.

### Monitoramento e Logging
Winston: Utilizado para gerar logs em diversos pontos do sistema, como na criação de playlists e no processamento de eventos.
Grafana e Prometheus: Configurados para monitorar métricas dos microserviços. Pré-configurações de dashboards e datasources estão disponíveis na pasta infra.

## Requisitos do Sistema
### Tecnologias
Node.js, Express, MongoDB, RabbitMQ, Redis, Docker, Jest, Winston, Grafana, Prometheus, opossum (Circuit Breaker).

### Pré-requisitos
Docker e Docker Compose instalados.
Configuração de variáveis de ambiente na pasta infra com base no arquivo .env-sample.

## Instruções de Instalação
Clone o repositório:

```git clone https://github.com/GugaAraujo/playlist-api.git

cd playlist-api
```

### Configuração de Variáveis de Ambiente:

Copie o arquivo .env-sample para .env e preencha as variáveis de ambiente conforme necessário.
Rodando o Docker Compose:

Na pasta infra, execute:

```docker-compose up --build```

Isso irá subir todos os serviços necessários (RabbitMQ, MongoDB, Redis, Grafana, Prometheus) e os microserviços.

### Acessando o Grafana:

Usuário: admin
Senha: admin (altere no primeiro acesso)

O dashboard do Grafana pode ser acessado através do http://localhost:3000.

### Rodando os Testes:

Para rodar todos os testes de todos os serviços, execute na pasta raiz do projeto:

```npm test```
Para rodar testes de um serviço específico, navegue até a pasta do serviço e execute:

```npm test```

## Desafios Enfrentados
Integração entre Serviços: Garantir que a comunicação entre os microserviços fosse robusta e escalável foi um desafio significativo, especialmente no tratamento de falhas com RabbitMQ.
Resiliência: Implementar um Circuit Breaker eficaz para garantir que falhas temporárias entre serviços não causassem uma falha total do sistema.

## Melhorias Futuras
Expansão das Análises: Implementar análises mais complexas no analysis-service.
Escalabilidade: Melhorar a escalabilidade do sistema com mais otimizações e distribuição de carga.
Segurança: Adicionar mais camadas de segurança, como encriptação de dados sensíveis e implementação de OAuth.

## Conclusão
Este projeto demonstra a arquitetura de um sistema de microserviços robusto e escalável, utilizando as melhores práticas de desenvolvimento backend. A integração assíncrona via RabbitMQ, juntamente com a resiliência proporcionada pelo Circuit Breaker e caching com Redis, mostra a capacidade do sistema em lidar com cargas de trabalho reais.