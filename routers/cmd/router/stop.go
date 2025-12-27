package router

import (
	"fmt"
	"os"

	"github.com/spf13/cobra"
	"github.com/spf13/viper"
)

// stopCmd represents the stop command
var stopCmd = &cobra.Command{
	Use:   "stop",
	Short: "Stop the Aether Mailer router",
	Long: `Stop the running Aether Mailer router gracefully.
This command will send a shutdown signal to the router process,
allowing it to finish processing current requests before exiting.`,
	Run: func(cmd *cobra.Command, args []string) {
		fmt.Println("Stopping Aether Mailer Router...")

		// In a real implementation, this would:
		// 1. Connect to the running router via API or PID file
		// 2. Send shutdown signal
		// 3. Wait for graceful shutdown
		// 4. Report status

		// For now, we'll simulate the stop process
		if err := stopRouter(); err != nil {
			fmt.Fprintf(os.Stderr, "Error stopping router: %v\n", err)
			os.Exit(1)
		}

		fmt.Println("Router stopped successfully")
	},
}

func init() {
	stopCmd.Flags().BoolP("force", "f", false, "force stop without graceful shutdown")
	stopCmd.Flags().Int("timeout", 30, "shutdown timeout in seconds")
	stopCmd.Flags().String("pid-file", "/var/run/router.pid", "PID file path")

	viper.BindPFlag("stop.force", stopCmd.Flags().Lookup("force"))
	viper.BindPFlag("stop.timeout", stopCmd.Flags().Lookup("timeout"))
	viper.BindPFlag("stop.pid_file", stopCmd.Flags().Lookup("pid-file"))
}

// stopRouter handles the router stopping logic
func stopRouter() error {
	force := viper.GetBool("stop.force")
	timeout := viper.GetInt("stop.timeout")
	pidFile := viper.GetString("stop.pid_file")

	if verbose {
		fmt.Printf("Force stop: %v\n", force)
		fmt.Printf("Timeout: %d seconds\n", timeout)
		fmt.Printf("PID file: %s\n", pidFile)
	}

	// Check if router is running
	if !isRouterRunning(pidFile) {
		return fmt.Errorf("router is not running")
	}

	// In a real implementation, send SIGTERM signal
	// For now, simulate the stop process
	if force {
		fmt.Println("Force stopping router...")
		// Would send SIGKILL
	} else {
		fmt.Printf("Gracefully stopping router (timeout: %ds)...\n", timeout)
		// Would send SIGTERM and wait
	}

	return nil
}

// isRouterRunning checks if the router is currently running
func isRouterRunning(pidFile string) bool {
	// In a real implementation, check PID file and process
	// For now, simulate check
	return true
}
