#:sdk Aspire.AppHost.Sdk@13.1.0
#:package Aspire.Hosting.PostgreSQL@13.1.0
#:package Aspire.Hosting.JavaScript@13.1.0
#:package DotNetEnv@3.1.1
#:package Aspire.Hosting.DevTunnels@13.1.0

// Agent Workforce Dashboard - Local Development AppHost
// Orchestrates PostgreSQL + Next.js for local development
// Run with: aspire run

// Helper to get env var with fallback
string Env(string key, string fallback = "") =>
    Environment.GetEnvironmentVariable(key) ?? fallback;

var builder = DistributedApplication.CreateBuilder(args);


// Next.js tracker application
// Note: Using fixed port 5000 for stable NEXTAUTH_URL configuration
// targetPort tells Aspire where Next.js listens; isProxied:false means no Aspire proxy
var tracker = builder.AddJavaScriptApp("tracker", ".", runScriptName: "dev")
    .WithEnvironment("PORT", "8090")
    .WithHttpEndpoint(targetPort: 8090, isProxied: false)
    .WithExternalHttpEndpoints()
    .WithEnvironment("NEXTAUTH_URL", "http://localhost:8090")
    // Environment
    .WithEnvironment("NODE_ENV", Env("NODE_ENV", "development"));

// DevTunnel should reference the app's endpoint, not create its own
var devtunnel = builder.AddDevTunnel("devtunnel")
    .WithReference(tracker.GetEndpoint("http"));

builder.Build().Run();
