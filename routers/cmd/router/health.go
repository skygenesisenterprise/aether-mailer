package router

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"time"

	"github.com/spf13/cobra"
	"github.com/spf13/viper"
)

// healthCmd represents the health command
var healthCmd = &cobra.Command{
	Use:   "health",
	Short: "Check the health of the Aether Mailer router",
	Long: `Check the health status of the Aether Mailer router and its components.
This command provides detailed health information including service status,
component health, and system metrics.`,
}

func init() {
	rootCmd.AddCommand(healthCmd)

	// Add subcommands
	healthCmd.AddCommand(healthCheckCmd)
	healthCmd.AddCommand(healthWatchCmd)
	healthCmd.AddCommand(healthListCmd)
}

// healthCheckCmd represents the health check command
var healthCheckCmd = &cobra.Command{
	Use:   "check",
	Short: "Perform a health check",
	Long: `Perform a comprehensive health check of the Aether Mailer router.
This command checks the router and all its components, reporting their status.`,
	Run: func(cmd *cobra.Command, args []string) {
		performHealthCheck()
	},
}

// healthWatchCmd represents the health watch command
var healthWatchCmd = &cobra.Command{
	Use:   "watch",
	Short: "Watch health status continuously",
	Long: `Continuously monitor the health status of the Aether Mailer router.
This command updates the health display at regular intervals.`,
	Run: func(cmd *cobra.Command, args []string) {
		watchHealth()
	},
}

// healthListCmd represents the health list command
var healthListCmd = &cobra.Command{
	Use:   "list",
	Short: "List health check endpoints",
	Long: `List all available health check endpoints and their status.
This command shows what health information is available from the router.`,
	Run: func(cmd *cobra.Command, args []string) {
		listHealthEndpoints()
	},
}

func init() {
	// health check flags
	healthCheckCmd.Flags().String("endpoint", "http://localhost:80/health", "health check endpoint")
	healthCheckCmd.Flags().Bool("ready", false, "check readiness instead of liveness")
	healthCheckCmd.Flags().Bool("detailed", false, "show detailed health information")
	healthCheckCmd.Flags().Bool("json", false, "output health status in JSON format")
	healthCheckCmd.Flags().Int("timeout", 5, "request timeout in seconds")

	viper.BindPFlag("health.check.endpoint", healthCheckCmd.Flags().Lookup("endpoint"))
	viper.BindPFlag("health.check.ready", healthCheckCmd.Flags().Lookup("ready"))
	viper.BindPFlag("health.check.detailed", healthCheckCmd.Flags().Lookup("detailed"))
	viper.BindPFlag("health.check.json", healthCheckCmd.Flags().Lookup("json"))
	viper.BindPFlag("health.check.timeout", healthCheckCmd.Flags().Lookup("timeout"))

	// health watch flags
	healthWatchCmd.Flags().String("endpoint", "http://localhost:80/health", "health check endpoint")
	healthWatchCmd.Flags().Int("interval", 5, "watch interval in seconds")
	healthWatchCmd.Flags().Bool("detailed", false, "show detailed health information")
	healthWatchCmd.Flags().Int("count", 0, "number of iterations (0 = infinite)")

	viper.BindPFlag("health.watch.endpoint", healthWatchCmd.Flags().Lookup("endpoint"))
	viper.BindPFlag("health.watch.interval", healthWatchCmd.Flags().Lookup("interval"))
	viper.BindPFlag("health.watch.detailed", healthWatchCmd.Flags().Lookup("detailed"))
	viper.BindPFlag("health.watch.count", healthWatchCmd.Flags().Lookup("count"))

	// health list flags
	healthListCmd.Flags().String("endpoint", "http://localhost:80/api/v1/registry/services", "services endpoint")
	healthListCmd.Flags().Bool("json", false, "output in JSON format")
	healthListCmd.Flags().Int("timeout", 5, "request timeout in seconds")

	viper.BindPFlag("health.list.endpoint", healthListCmd.Flags().Lookup("endpoint"))
	viper.BindPFlag("health.list.json", healthListCmd.Flags().Lookup("json"))
	viper.BindPFlag("health.list.timeout", healthListCmd.Flags().Lookup("timeout"))
}

// performHealthCheck performs a comprehensive health check
func performHealthCheck() {
	endpoint := viper.GetString("health.check.endpoint")
	checkReady := viper.GetBool("health.check.ready")
	detailed := viper.GetBool("health.check.detailed")
	jsonOutput := viper.GetBool("health.check.json")
	timeout := viper.GetInt("health.check.timeout")

	if verbose {
		fmt.Printf("Performing health check at: %s\n", endpoint)
		if checkReady {
			fmt.Println("Checking readiness instead of liveness")
		}
	}

	// Choose appropriate endpoint
	if checkReady {
		endpoint = endpoint + "/ready"
	} else {
		endpoint = endpoint + "/live"
	}

	// Create HTTP client
	client := &http.Client{
		Timeout: time.Duration(timeout) * time.Second,
	}

	// Perform health check
	health, err := getHealthStatus(client, endpoint)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Health check failed: %v\n", err)
		os.Exit(1)
	}

	// Output results
	if jsonOutput {
		outputJSON(health)
	} else {
		outputHealthStatus(health, detailed)
	}

	// Check overall health status
	if !isHealthy(health) {
		os.Exit(1)
	}
}

// watchHealth continuously monitors health status
func watchHealth() {
	endpoint := viper.GetString("health.watch.endpoint")
	interval := viper.GetInt("health.watch.interval")
	detailed := viper.GetBool("health.watch.detailed")
	count := viper.GetInt("health.watch.count")

	if verbose {
		fmt.Printf("Watching health status at: %s\n", endpoint)
		fmt.Printf("Update interval: %d seconds\n", interval)
		if count > 0 {
			fmt.Printf("Number of iterations: %d\n", count)
		} else {
			fmt.Println("Watching indefinitely (use Ctrl+C to stop)")
		}
	}

	// Create HTTP client
	client := &http.Client{
		Timeout: 10 * time.Second,
	}

	iteration := 0
	for {
		iteration++

		// Clear screen for better display
		fmt.Print("\033[2J\033[H")
		fmt.Printf("=== Aether Mailer Router Health Status (Iteration %d) ===\n", iteration)
		fmt.Printf("Time: %s\n\n", time.Now().Format("2006-01-02 15:04:05"))

		// Get health status
		health, err := getHealthStatus(client, endpoint+"/live")
		if err != nil {
			fmt.Printf("❌ Health check failed: %v\n", err)
		} else {
			outputHealthStatus(health, detailed)
		}

		// Check if we should continue
		if count > 0 && iteration >= count {
			break
		}

		// Wait for next iteration
		time.Sleep(time.Duration(interval) * time.Second)
	}
}

// listHealthEndpoints lists available health endpoints
func listHealthEndpoints() {
	endpoint := viper.GetString("health.list.endpoint")
	jsonOutput := viper.GetBool("health.list.json")
	timeout := viper.GetInt("health.list.timeout")

	if verbose {
		fmt.Printf("Querying services from: %s\n", endpoint)
	}

	// Create HTTP client
	client := &http.Client{
		Timeout: time.Duration(timeout) * time.Second,
	}

	// Get services list
	services, err := getServicesList(client, endpoint)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error getting services list: %v\n", err)
		os.Exit(1)
	}

	// Output results
	if jsonOutput {
		outputJSON(services)
	} else {
		outputHealthEndpoints(services)
	}
}

// HealthStatus represents the health status response
type HealthStatus struct {
	Success bool `json:"success"`
	Data    struct {
		Status     string                 `json:"status"`
		Timestamp  string                 `json:"timestamp"`
		Uptime     float64                `json:"uptime"`
		Components map[string]interface{} `json:"components"`
	} `json:"data"`
	Error *struct {
		Code    string `json:"code"`
		Message string `json:"message"`
	} `json:"error"`
}

// ServicesList represents the services list response
type ServicesList struct {
	Success bool `json:"success"`
	Data    struct {
		Services []map[string]interface{} `json:"services"`
		Count    int                      `json:"count"`
	} `json:"data"`
	Error *struct {
		Code    string `json:"code"`
		Message string `json:"message"`
	} `json:"error"`
}

// getHealthStatus retrieves health status from the API
func getHealthStatus(client *http.Client, endpoint string) (*HealthStatus, error) {
	resp, err := client.Get(endpoint)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to router: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("health check returned status %d", resp.StatusCode)
	}

	var health HealthStatus
	if err := json.NewDecoder(resp.Body).Decode(&health); err != nil {
		return nil, fmt.Errorf("failed to decode health response: %w", err)
	}

	return &health, nil
}

// getServicesList retrieves services list from the API
func getServicesList(client *http.Client, endpoint string) (*ServicesList, error) {
	resp, err := client.Get(endpoint)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to router: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("services list returned status %d", resp.StatusCode)
	}

	var services ServicesList
	if err := json.NewDecoder(resp.Body).Decode(&services); err != nil {
		return nil, fmt.Errorf("failed to decode services response: %w", err)
	}

	return &services, nil
}

// outputHealthStatus outputs health status in human-readable format
func outputHealthStatus(health *HealthStatus, detailed bool) {
	// Overall status
	status := health.Data.Status
	statusIcon := "❌"
	if status == "healthy" || status == "alive" {
		statusIcon = "✅"
	}

	fmt.Printf("%s Overall Status: %s\n", statusIcon, status)
	fmt.Printf("Timestamp: %s\n", health.Data.Timestamp)
	fmt.Printf("Uptime: %.2f seconds\n", health.Data.Uptime)

	// Component status
	if len(health.Data.Components) > 0 {
		fmt.Println("\n--- Component Status ---")
		for name, component := range health.Data.Components {
			if compInfo, ok := component.(map[string]interface{}); ok {
				if compStatus, ok := compInfo["status"].(string); ok {
					icon := "❌"
					if compStatus == "healthy" {
						icon = "✅"
					}
					fmt.Printf("%s %-12s: %s\n", icon, name, compStatus)

					// Show additional details if requested
					if detailed {
						if services, ok := compInfo["services"].(float64); ok {
							fmt.Printf("    Services: %.0f\n", services)
						}
						if algorithm, ok := compInfo["algorithm"].(string); ok {
							fmt.Printf("    Algorithm: %s\n", algorithm)
						}
					}
				}
			}
		}
	}
}

// outputHealthEndpoints outputs health endpoints information
func outputHealthEndpoints(services *ServicesList) {
	fmt.Printf("=== Health Endpoints (%d services) ===\n", services.Data.Count)

	if len(services.Data.Services) == 0 {
		fmt.Println("No services registered")
		return
	}

	for i, service := range services.Data.Services {
		fmt.Printf("\n--- Service %d ---\n", i+1)

		if id, ok := service["id"].(string); ok {
			fmt.Printf("ID: %s\n", id)
		}
		if name, ok := service["name"].(string); ok {
			fmt.Printf("Name: %s\n", name)
		}
		if address, ok := service["address"].(string); ok {
			fmt.Printf("Address: %s\n", address)
		}
		if port, ok := service["port"].(float64); ok {
			fmt.Printf("Port: %d\n", int(port))
		}
		if protocol, ok := service["protocol"].(string); ok {
			fmt.Printf("Protocol: %s\n", protocol)
		}

		// Health status
		if health, ok := service["health"].(map[string]interface{}); ok {
			if status, ok := health["status"].(string); ok {
				icon := "❌"
				if status == "healthy" {
					icon = "✅"
				}
				fmt.Printf("Health: %s %s\n", icon, status)
			}
			if message, ok := health["message"].(string); ok {
				fmt.Printf("Message: %s\n", message)
			}
			if checkedAt, ok := health["checked_at"].(string); ok {
				fmt.Printf("Last Check: %s\n", checkedAt)
			}
		}

		// Health endpoint URL
		if id, ok := service["id"].(string); ok {
			fmt.Printf("Health Endpoint: /api/v1/registry/services/%s/health\n", id)
		}
	}
}

// isHealthy checks if the overall health status is healthy
func isHealthy(health *HealthStatus) bool {
	status := health.Data.Status
	return status == "healthy" || status == "alive" || status == "ready"
}

// outputJSON outputs data in JSON format
func outputJSON(data interface{}) {
	encoder := json.NewEncoder(os.Stdout)
	encoder.SetIndent("", "  ")
	if err := encoder.Encode(data); err != nil {
		fmt.Fprintf(os.Stderr, "Error encoding JSON: %v\n", err)
		os.Exit(1)
	}
}
