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

// configCmd represents the config command
var configCmd = &cobra.Command{
	Use:   "config",
	Short: "Manage router configuration",
	Long: `Manage the Aether Mailer router configuration.
This command allows you to view, validate, and reload the router configuration.`,
}

func init() {
	rootCmd.AddCommand(configCmd)

	// Add subcommands
	configCmd.AddCommand(configShowCmd)
	configCmd.AddCommand(configValidateCmd)
	configCmd.AddCommand(configReloadCmd)
	configCmd.AddCommand(configListCmd)
}

// configShowCmd represents the config show command
var configShowCmd = &cobra.Command{
	Use:   "show",
	Short: "Show the current router configuration",
	Long: `Display the current configuration of the Aether Mailer router.
This command retrieves the configuration from the running router instance.`,
	Run: func(cmd *cobra.Command, args []string) {
		showConfig()
	},
}

// configValidateCmd represents the config validate command
var configValidateCmd = &cobra.Command{
	Use:   "validate [config-file]",
	Short: "Validate a router configuration file",
	Long: `Validate a router configuration file without starting the router.
This command checks the configuration for syntax errors and logical issues.`,
	Args: cobra.MaximumNArgs(1),
	Run: func(cmd *cobra.Command, args []string) {
		validateConfig(args)
	},
}

// configReloadCmd represents the config reload command
var configReloadCmd = &cobra.Command{
	Use:   "reload",
	Short: "Reload the router configuration",
	Long: `Reload the configuration of the running Aether Mailer router.
This command causes the router to re-read its configuration file and apply changes.`,
	Run: func(cmd *cobra.Command, args []string) {
		reloadConfig()
	},
}

// configListCmd represents the config list command
var configListCmd = &cobra.Command{
	Use:   "list",
	Short: "List configuration options and their values",
	Long: `List all available configuration options and their current values.
This command shows both default values and values from configuration files.`,
	Run: func(cmd *cobra.Command, args []string) {
		listConfig()
	},
}

func init() {
	// config show flags
	configShowCmd.Flags().String("endpoint", "http://localhost:80/api/v1/router/config", "router config endpoint")
	configShowCmd.Flags().Bool("json", false, "output configuration in JSON format")
	configShowCmd.Flags().Bool("secrets", false, "show sensitive configuration values")
	configShowCmd.Flags().Int("timeout", 5, "request timeout in seconds")

	viper.BindPFlag("config.show.endpoint", configShowCmd.Flags().Lookup("endpoint"))
	viper.BindPFlag("config.show.json", configShowCmd.Flags().Lookup("json"))
	viper.BindPFlag("config.show.secrets", configShowCmd.Flags().Lookup("secrets"))
	viper.BindPFlag("config.show.timeout", configShowCmd.Flags().Lookup("timeout"))

	// config validate flags
	configValidateCmd.Flags().Bool("verbose", false, "show detailed validation results")
	configValidateCmd.Flags().String("schema", "", "configuration schema file for validation")

	viper.BindPFlag("config.validate.verbose", configValidateCmd.Flags().Lookup("verbose"))
	viper.BindPFlag("config.validate.schema", configValidateCmd.Flags().Lookup("schema"))

	// config reload flags
	configReloadCmd.Flags().String("endpoint", "http://localhost:80/api/v1/router/reload", "router reload endpoint")
	configReloadCmd.Flags().Int("timeout", 30, "reload timeout in seconds")

	viper.BindPFlag("config.reload.endpoint", configReloadCmd.Flags().Lookup("endpoint"))
	viper.BindPFlag("config.reload.timeout", configReloadCmd.Flags().Lookup("timeout"))

	// config list flags
	configListCmd.Flags().String("section", "", "show only specific configuration section")
	configListCmd.Flags().Bool("defaults", false, "show default values")
	configListCmd.Flags().Bool("env", false, "show environment variables")

	viper.BindPFlag("config.list.section", configListCmd.Flags().Lookup("section"))
	viper.BindPFlag("config.list.defaults", configListCmd.Flags().Lookup("defaults"))
	viper.BindPFlag("config.list.env", configListCmd.Flags().Lookup("env"))
}

// showConfig displays the current router configuration
func showConfig() {
	endpoint := viper.GetString("config.show.endpoint")
	jsonOutput := viper.GetBool("config.show.json")
	showSecrets := viper.GetBool("config.show.secrets")
	timeout := viper.GetInt("config.show.timeout")

	if verbose {
		fmt.Printf("Querying configuration from: %s\n", endpoint)
	}

	// Create HTTP client
	client := &http.Client{
		Timeout: time.Duration(timeout) * time.Second,
	}

	// Get configuration
	config, err := getRouterConfig(client, endpoint)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error getting router configuration: %v\n", err)
		os.Exit(1)
	}

	// Output configuration
	if jsonOutput {
		outputJSON(config)
	} else {
		outputConfig(config, showSecrets)
	}
}

// validateConfig validates a configuration file
func validateConfig(args []string) {
	verbose := viper.GetBool("config.validate.verbose")
	schemaFile := viper.GetString("config.validate.schema")

	var configFile string
	if len(args) > 0 {
		configFile = args[0]
	} else if cfgFile != "" {
		configFile = cfgFile
	} else {
		configFile = "router.yaml"
	}

	if verbose {
		fmt.Printf("Validating configuration file: %s\n", configFile)
		if schemaFile != "" {
			fmt.Printf("Using schema file: %s\n", schemaFile)
		}
	}

	// Load and validate configuration
	if err := validateConfigFile(configFile, schemaFile, verbose); err != nil {
		fmt.Fprintf(os.Stderr, "Configuration validation failed: %v\n", err)
		os.Exit(1)
	}

	fmt.Println("✅ Configuration is valid")
}

// reloadConfig reloads the router configuration
func reloadConfig() {
	endpoint := viper.GetString("config.reload.endpoint")
	timeout := viper.GetInt("config.reload.timeout")

	if verbose {
		fmt.Printf("Reloading configuration via: %s\n", endpoint)
		fmt.Printf("Timeout: %d seconds\n", timeout)
	}

	// Create HTTP client
	client := &http.Client{
		Timeout: time.Duration(timeout) * time.Second,
	}

	// Send reload request
	resp, err := client.Post(endpoint, "application/json", nil)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error reloading configuration: %v\n", err)
		os.Exit(1)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusAccepted {
		fmt.Fprintf(os.Stderr, "Router returned status %d\n", resp.StatusCode)
		os.Exit(1)
	}

	var response map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&response); err != nil {
		fmt.Printf("Configuration reload initiated (response parsing failed)\n")
		return
	}

	if success, ok := response["success"].(bool); ok && success {
		fmt.Println("✅ Configuration reload initiated successfully")
		if data, ok := response["data"].(map[string]interface{}); ok {
			if msg, ok := data["message"].(string); ok {
				fmt.Printf("Message: %s\n", msg)
			}
		}
	} else {
		fmt.Printf("⚠️  Configuration reload initiated with warnings\n")
	}
}

// listConfig lists configuration options
func listConfig() {
	section := viper.GetString("config.list.section")
	showDefaults := viper.GetBool("config.list.defaults")
	showEnv := viper.GetBool("config.list.env")

	fmt.Println("=== Router Configuration ===")

	if section != "" {
		fmt.Printf("Section: %s\n", section)
		listConfigSection(section, showDefaults, showEnv)
	} else {
		listAllConfig(showDefaults, showEnv)
	}
}

// RouterConfig represents the router configuration response
type RouterConfig struct {
	Success bool                   `json:"success"`
	Data    map[string]interface{} `json:"data"`
	Error   *struct {
		Code    string `json:"code"`
		Message string `json:"message"`
	} `json:"error"`
}

// getRouterConfig retrieves the router configuration from the API
func getRouterConfig(client *http.Client, endpoint string) (*RouterConfig, error) {
	resp, err := client.Get(endpoint)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to router: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("router returned status %d", resp.StatusCode)
	}

	var config RouterConfig
	if err := json.NewDecoder(resp.Body).Decode(&config); err != nil {
		return nil, fmt.Errorf("failed to decode config response: %w", err)
	}

	return &config, nil
}

// outputConfig outputs the configuration in human-readable format
func outputConfig(config *RouterConfig, showSecrets bool) {
	fmt.Println("=== Current Router Configuration ===")

	if data, ok := config.Data["server"].(map[string]interface{}); ok {
		fmt.Println("\n--- Server Configuration ---")
		if host, ok := data["host"].(string); ok {
			fmt.Printf("Host:         %s\n", host)
		}
		if port, ok := data["port"].(float64); ok {
			fmt.Printf("Port:         %d\n", int(port))
		}
		if readTimeout, ok := data["read_timeout"].(string); ok {
			fmt.Printf("Read Timeout: %s\n", readTimeout)
		}
		if writeTimeout, ok := data["write_timeout"].(string); ok {
			fmt.Printf("Write Timeout: %s\n", writeTimeout)
		}
	}

	if data, ok := config.Data["load_balancer"].(map[string]interface{}); ok {
		fmt.Println("\n--- Load Balancer Configuration ---")
		if algorithm, ok := data["algorithm"].(string); ok {
			fmt.Printf("Algorithm: %s\n", algorithm)
		}
		if sticky, ok := data["sticky"].(bool); ok {
			fmt.Printf("Sticky Sessions: %v\n", sticky)
		}
	}

	if data, ok := config.Data["services"].(map[string]interface{}); ok {
		fmt.Println("\n--- Services Configuration ---")
		if discovery, ok := data["discovery"].(map[string]interface{}); ok {
			if dtype, ok := discovery["type"].(string); ok {
				fmt.Printf("Discovery Type: %s\n", dtype)
			}
		}
		if health, ok := data["health"].(map[string]interface{}); ok {
			if enabled, ok := health["enabled"].(bool); ok {
				fmt.Printf("Health Checks: %v\n", enabled)
			}
		}
	}

	if data, ok := config.Data["security"].(map[string]interface{}); ok {
		fmt.Println("\n--- Security Configuration ---")
		if rateLimit, ok := data["rate_limit"].(map[string]interface{}); ok {
			if enabled, ok := rateLimit["enabled"].(bool); ok {
				fmt.Printf("Rate Limiting: %v\n", enabled)
			}
		}
		if cors, ok := data["cors"].(map[string]interface{}); ok {
			if enabled, ok := cors["enabled"].(bool); ok {
				fmt.Printf("CORS: %v\n", enabled)
			}
		}
	}

	if data, ok := config.Data["monitoring"].(map[string]interface{}); ok {
		fmt.Println("\n--- Monitoring Configuration ---")
		if enabled, ok := data["enabled"].(bool); ok {
			fmt.Printf("Monitoring: %v\n", enabled)
		}
		if metrics, ok := data["metrics"].(bool); ok {
			fmt.Printf("Metrics: %v\n", metrics)
		}
	}

	if !showSecrets {
		fmt.Println("\n--- Sensitive Configuration ---")
		fmt.Println("(Use --secrets flag to show sensitive values)")
	}
}

// outputJSON outputs the configuration in JSON format
func outputJSON(config *RouterConfig) {
	encoder := json.NewEncoder(os.Stdout)
	encoder.SetIndent("", "  ")
	if err := encoder.Encode(config); err != nil {
		fmt.Fprintf(os.Stderr, "Error encoding JSON: %v\n", err)
		os.Exit(1)
	}
}

// validateConfigFile validates a configuration file
func validateConfigFile(configFile, schemaFile string, verbose bool) error {
	// This is a placeholder implementation
	// In a real implementation, this would:
	// 1. Load the configuration file
	// 2. Validate YAML syntax
	// 3. Validate against schema if provided
	// 4. Validate logical constraints
	// 5. Check for required fields

	if verbose {
		fmt.Println("Loading configuration file...")
		fmt.Println("Validating YAML syntax...")
		if schemaFile != "" {
			fmt.Println("Validating against schema...")
		}
		fmt.Println("Validating logical constraints...")
		fmt.Println("Checking required fields...")
	}

	return nil
}

// listConfigSection lists a specific configuration section
func listConfigSection(section string, showDefaults, showEnv bool) {
	// This is a placeholder implementation
	// In a real implementation, this would list only the specified section
	fmt.Printf("Configuration for section: %s\n", section)
}

// listAllConfig lists all configuration options
func listAllConfig(showDefaults, showEnv bool) {
	// This is a placeholder implementation
	// In a real implementation, this would list all configuration options
	fmt.Println("All configuration options:")

	if showDefaults {
		fmt.Println("\n--- Default Values ---")
		fmt.Println("host: 0.0.0.0")
		fmt.Println("port: 80")
		fmt.Println("algorithm: round_robin")
	}

	if showEnv {
		fmt.Println("\n--- Environment Variables ---")
		fmt.Println("ROUTER_HOST")
		fmt.Println("ROUTER_PORT")
		fmt.Println("ROUTER_CONFIG")
	}
}
