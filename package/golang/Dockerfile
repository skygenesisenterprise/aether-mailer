# Multi-stage build for Go SDK Docker image
FROM golang:1.25-alpine AS builder

# Install build dependencies
RUN apk add --no-cache git ca-certificates tzdata

WORKDIR /app

# Copy go mod and sum files
COPY go.mod go.sum ./

# Download dependencies
RUN go mod download

# Copy source code
COPY ./ ./

# Build the SDK for multiple architectures
ARG TARGETARCH
ARG TARGETOS

# Create version info
ARG VERSION=dev
ARG COMMIT_SHA
ARG BUILD_DATE

RUN CGO_ENABLED=0 GOOS=${TARGETOS} GOARCH=${TARGETARCH} go build \
    -ldflags="-s -w \
    -X main.Version=${VERSION} \
    -X main.CommitSHA=${COMMIT_SHA} \
    -X main.BuildDate=${BUILD_DATE}" \
    -a -installsuffix cgo \
    -o aether-mailer-sdk .

# Runtime image
FROM alpine:3.19

# Install runtime dependencies
RUN apk --no-cache add ca-certificates tzdata git curl

# Create non-root user
RUN addgroup -g 1000 -S aether && \
    adduser -u 1000 -S aether -G aether

WORKDIR /app

# Copy binary from builder stage
COPY --from=builder /app/aether-mailer-sdk /usr/local/bin/aether-mailer-sdk

# Copy documentation and examples
COPY README.md /usr/local/share/doc/aether-mailer-sdk/README.md
COPY examples/ /usr/local/share/doc/aether-mailer-sdk/examples/

# Set ownership
RUN chown -R aether:aether /app /usr/local/share/doc/aether-mailer-sdk

# Switch to non-root user
USER aether

# Expose common ports (if SDK includes any HTTP services)
EXPOSE 8080 8443

# Set environment variables
ENV GOCACHE=/tmp/.cache
ENV GOMODCACHE=/tmp/.cache/mod

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD aether-mailer-sdk version || exit 1

# Default command
ENTRYPOINT ["aether-mailer-sdk"]
CMD ["--help"]

# Labels
LABEL org.opencontainers.image.title="Aether Mailer Go SDK"
LABEL org.opencontainers.image.description="Complete Go SDK for Aether Mailer with domain-driven design"
LABEL org.opencontainers.image.version="${VERSION}"
LABEL org.opencontainers.image.source="https://github.com/skygenesisenterprise/aether-mailer"
LABEL org.opencontainers.image.licenses="MIT"
LABEL org.opencontainers.image.vendor="Sky Genesis Enterprise"
LABEL org.opencontainers.image.documentation="https://pkg.go.dev/github.com/skygenesisenterprise/aether-mailer/package/golang"

# Security labels
LABEL org.opencontainers.image.security.selinux="type:container_runtime_t"
LABEL org.opencontainers.image.security.apparmor="docker-default"

# Build arguments
ARG BUILDPLATFORM
ARG TARGETOS
ARG TARGETARCH
ARG TARGETVARIANT

# Platform information
LABEL org.opencontainers.image.platform="linux/${TARGETARCH}"
LABEL org.opencontainers.image.created="${BUILD_DATE}"
LABEL org.opencontainers.image.revision="${COMMIT_SHA}"