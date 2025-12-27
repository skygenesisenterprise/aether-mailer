package router

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"strconv"

	"github.com/skygenesisenterprise/aether-mailer/routers/pkg/routerpkg"
	"github.com/spf13/cobra"
	"github.com/spf13/viper"
)

// servicesCmd represents the services command
var servicesCmd = &cobra.Command{
	Use:   "services",
	Short: "Manage services in the router",
	Long: `Manage services registered in the Aether Mailer router.
This command allows you to list, register, unregister, and check the health of services.`,
}

func init() {
	rootCmd.AddCommand(servicesCmd)

	// Add subcommands
	servicesCmd.AddCommand(servicesListCmd)
	servicesCmd.AddCommand(servicesRegisterCmd)
	servicesCmd.AddCommand(servicesUnregisterCmd)
	servicesCmd.AddCommand(servicesHealthCmd)
}

// servicesListCmd represents the services list command
var servicesListCmd = &cobra.Command{
	Use:   "list",
	Short: "List all registered services",
	Long: `List all services registered in the router.
Shows service details including address, port, health status, and metadata.`,
	Run: func(cmd *cobra.Command, args []string) {
		listServices()
	},
}

// servicesRegisterCmd represents the services register command
var servicesRegisterCmd = &cobra.Command{
	Use:   "register [service-file]",
	Short: "Register a new service",
	Long: `Register a new service with the router.
Accepts a JSON file or interactive input for service configuration.`,
	Args: cobra.MaximumNArgs(1),
	Run: func(cmd *cobra.Command, args []string) {
		registerService(args)
	},
}

// servicesUnregisterCmd represents the services unregister command
var servicesUnregisterCmd = &cobra.Command{
	Use:   "unregister [service-id]",
	Short: "Unregister a service",
	Long: `Unregister a service from the router.
Removes the specified service ID from the service registry.`,
	Args: cobra.ExactArgs(1),
	Run: func(cmd *cobra.Command, args []string) {
		unregisterService(args)
	},
}

// servicesHealthCmd represents the services health command
var servicesHealthCmd = &cobra.Command{
	Use:   "health [service-id]",
	Short: "Check service health",
	Long: `Check the health status of a specific service.
Performs a health check on the specified service and returns the status.`,
	Args: cobra.ExactArgs(1),
	Run: func(cmd *cobra.Command, args []string) {
		checkServiceHealth(args)
	},
}

// servicesListCmd represents the services list command
var servicesListCmd = &cobra.Command{
	Use:   "list",
	Short: "List all registered services",
	Long: `List all services registered in the router.
Shows service details including address, port, health status, and metadata.`,
	Run: func(cmd *cobra.Command, args []string) {
		listServices()
	},
}

// listServices displays all registered services
func listServices() {
	endpoint := viper.GetString("services.list.endpoint")
	jsonOutput := viper.GetBool("services.list.json")
	timeout := viper.GetInt("services.list.timeout")

	if verbose {
		fmt.Printf("Querying services from: %s\n", endpoint)
	}

	// Create HTTP client
	client := &http.Client{
		Timeout: time.Duration(timeout) * time.Second,
	}

	// Get services list
	resp, err := client.Get(endpoint)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error getting services list: %v\n", err)
		os.Exit(1)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		fmt.Fprintf(os.Stderr, "Services list endpoint returned status %d\n", resp.StatusCode)
		os.Exit(1)
	}

	var servicesList routerpkg.ServicesList
	if err := json.NewDecoder(resp.Body).Decode(&servicesList); err != nil {
		fmt.Fprintf(os.Stderr, "Error decoding services list: %v\n", err)
		os.Exit(1)
	}

	// Output results
	if jsonOutput {
		outputJSONServices(servicesList)
	} else {
		outputServicesList(servicesList)
	}
}

// ServicesList represents a services list response
type ServicesList struct {
	Success bool `json:"success"`
	Data    struct {
		Services []routerpkg.Service `json:"services"`
		Count    int                 `json:"count"`
	} `json:"data"`
	Error *struct {
		Code    string `json:"code"`
		Message string `json:"message"`
	} `json:"error"`
}

// registerService handles service registration
func registerService(args []string) {
	if len(args) == 0 {
		fmt.Fprintf(os.Stderr, "Error: service file is required\n")
		os.Exit(1)
	}

	serviceFile := args[0]

	// Read service configuration from file
	service, err := readServiceConfig(serviceFile)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error reading service file: %v\n", err)
		os.Exit(1)
	}

	// Register service via API
	endpoint := viper.GetString("services.register.endpoint")

	client := &http.Client{Timeout: 30 * time.Second}

	serviceJSON, err := json.Marshal(service)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error marshaling service: %v\n", err)
		os.Exit(1)
	}

	resp, err := client.Post(endpoint, "application/json", strings.NewReader(string(serviceJSON)))
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error registering service: %v\n", err)
		os.Exit(1)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusCreated {
		fmt.Fprintf(os.Stderr, "Registration failed with status %d\n", resp.StatusCode)
		os.Exit(1)
	}

	var response map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&response); err != nil {
		fmt.Printf("Service registered (response parsing failed)\n")
		return
	}

	if success, ok := response["success"].(bool); ok && success {
		fmt.Printf("✅ Service registered successfully: %s\n", service.ID)
		if data, ok := response["data"].(map[string]interface{}); ok {
			if id, ok := data["id"].(string); ok {
				fmt.Printf("    ID: %s\n", id)
			}
			if name, ok := data["name"].(string); ok {
				fmt.Printf("    Name: %s\n", name)
			}
			if addr, ok := data["address"].(string); ok {
				fmt.Printf("    Address: %s\n", addr)
			}
			if port, ok := data["port"].(float64); ok {
				fmt.Printf("    Port: %d\n", int(port))
			}
		}
	} else {
		fmt.Printf("⚠️  Registration completed with warnings\n")
	}
}

// unregisterService handles service unregistration
func unregisterService(args []string) {
	if len(args) == 0 {
		fmt.Fprintf(os.Stderr, "Error: service ID is required\n")
		os.Exit(1)
	}

	serviceID := args[0]

	if verbose {
		fmt.Printf("Unregistering service: %s\n", serviceID)
	}

	// Unregister service via API
	endpoint := viper.GetString("services.unregister.endpoint")

	url := fmt.Sprintf("%s/%s", endpoint, serviceID)

	client := &http.Client{Timeout: 30 * time.Second}

	resp, err := client.Delete(url)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error unregistering service: %v\n", err)
		os.Exit(1)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusAccepted {
		fmt.Fprintf(os.Stderr, "Unregistration failed with status %d\n", resp.StatusCode)
		os.Exit(1)
	}

	var response map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&response); err != nil {
		fmt.Printf("Service unregistered (response parsing failed)\n")
		return
	}

	if success, ok := response["success"].(bool); ok && success {
		fmt.Printf("✅ Service unregistered successfully: %s\n", serviceID)
	} else {
		fmt.Printf("⚠️  Unregistration completed with warnings\n")
	}
}

// checkServiceHealth handles service health check
func checkServiceHealth(args []string) {
	if len(args) == 0 {
		fmt.Fprintf(os.Stderr, "Error: service ID is required\n")
		os.Exit(1)
	}

	serviceID := args[0]

	if verbose {
		fmt.Printf("Checking health of service: %s\n", serviceID)
	}

	// Check service health via API
	endpoint := viper.GetString("services.health.endpoint")

	url := fmt.Sprintf("%s/%s", endpoint, serviceID)

	client := &http.Client{Timeout: 30 * time.Second}

	resp, err := client.Get(url)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error checking service health: %v\n", err)
		os.Exit(1)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		fmt.Printf("Health check failed with status %d\n", resp.StatusCode)
		os.Exit(1)
	}

	var health routerpkg.HealthStatus
	if err := json.NewDecoder(resp.Body).Decode(&health); err != nil {
		fmt.Printf("Health check completed (response parsing failed)\n")
		return
	}

	// Display health status
	status := health.Status
	statusIcon := "❌"
	if status == routerpkg.HealthStateHealthy {
		statusIcon = "✅"
	} else if status == routerpkg.HealthStateUnknown {
		statusIcon = "❓"
	}

	fmt.Printf("%s Service %s: %s\n", statusIcon, serviceID, status)
	if health.Message != "" {
		fmt.Printf("  Message: %s\n", health.Message)
	}
	if !health.CheckedAt.IsZero() {
		fmt.Printf("  Last Check: %s\n", health.CheckedAt.Format("2006-01-02 15:04:05"))
	}
	if health.Duration > 0 {
		fmt.Printf("  Duration: %v\n", health.Duration)
	}
	if len(health.Details) > 0 {
		fmt.Println("  Details:")
		for key, value := range health.Details {
			fmt.Printf("    %s: %v\n", key, value)
		}
	}
}

// outputJSONServices outputs services list in JSON format
func outputJSONServices(servicesList routerpkg.ServicesList) {
	encoder := json.NewEncoder(os.Stdout)
	encoder.SetIndent("", "  ")
	if err := encoder.Encode(servicesList); err != nil {
		fmt.Fprintf(os.Stderr, "Error encoding JSON: %v\n", err)
		os.Exit(1)
	}
}

// outputServicesList outputs services list in human-readable format
func outputServicesList(servicesList routerpkg.ServicesList) {
	fmt.Printf("=== Registered Services (%d) ===\n", servicesList.Data.Count)

	if len(servicesList.Data.Services) == 0 {
		fmt.Println("No services registered")
		return
	}

	for i, service := range servicesList.Data.Services {
		fmt.Printf("\n--- Service %d ---\n", i+1)
		fmt.Printf("ID:         %s\n", service.ID)
		fmt.Printf("Name:       %s\n", service.Name)
		fmt.Printf("Type:       %s\n", service.Type)
		fmt.Printf("Address:    %s\n", service.Address)
		fmt.Printf("Port:       %d\n", service.Port)
		fmt.Printf("Protocol:   %s\n", service.Protocol)
		fmt.Printf("Weight:     %d\n", service.Weight)

		// Health status
		if service.Health != nil {
			status := service.Health.Status
			statusIcon := "❌"
			if status == routerpkg.HealthStateHealthy {
				statusIcon = "✅"
			} else if status == routerpkg.HealthStateUnknown {
				statusIcon = "❓"
			}

			fmt.Printf("Health:     %s %s\n", statusIcon, status)
			if service.Health.Message != "" {
				fmt.Printf("Message:    %s\n", service.Health.Message)
			}
			if !service.Health.CheckedAt.IsZero() {
				fmt.Printf("Last Check: %s\n", service.Health.CheckedAt.Format("2006-01-02 15:04:05"))
			}
		} else {
			fmt.Printf("Health:     ❓ Unknown\n")
		}

		// Metadata
		if len(service.Metadata) > 0 {
			fmt.Println("Metadata:")
			for key, value := range service.Metadata {
				fmt.Printf("  %s: %s\n", key, value)
			}
		}

		// Tags
		if len(service.Tags) > 0 {
			fmt.Printf("Tags:       %s\n", strings.Join(service.Tags, ", "))
		}

		// Timestamps
		fmt.Printf("Created:    %s\n", service.CreatedAt.Format("2006-01-02 15:04:05"))
		if !service.UpdatedAt.IsZero() && service.UpdatedAt != service.CreatedAt {
			fmt.Printf("Updated:    %s\n", service.UpdatedAt.Format("2006-01-02 15:04:05"))
		}
		if !service.LastSeen.IsZero() {
			fmt.Printf("Last Seen: %s\n", service.LastSeen.Format("2006-01-02 15:04:05"))
		}
	}
}

// readServiceConfig reads service configuration from file
func readServiceConfig(filename string) (*routerpkg.Service, error) {
	file, err := os.Open(filename)
	if err != nil {
		return nil, fmt.Errorf("failed to open service file: %w", err)
	}
	defer file.Close()

	var service routerpkg.Service
	decoder := json.NewDecoder(file)
	if err := decoder.Decode(&service); err != nil {
		return nil, fmt.Errorf("failed to decode service file: %w", err)
	}

	// Validate required fields
	if service.ID == "" {
		return nil, fmt.Errorf("service ID is required")
	}
	if service.Name == "" {
		return nil, fmt.Errorf("service name is required")
	}
	if service.Address == "" {
		return nil, fmt.Errorf("service address is required")
	}
	if service.Port == 0 {
		return nil, fmt.Errorf("service port is required")
	}

	return &service, nil
}
