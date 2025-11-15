FROM golang:1.24.0-alpine

WORKDIR /app

# Instalar dependencias del sistema
RUN apk update && apk add --no-cache gcc musl-dev postgresql-dev

# Copiar archivos de módulos primero
COPY go.mod go.sum ./

# Descargar dependencias
RUN go mod download

# Copiar todo el código fuente
COPY . .

# Compilar la aplicación
RUN go build -o main .

EXPOSE 8080

CMD ["./main"]