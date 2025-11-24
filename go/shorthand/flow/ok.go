package flow

// Helper for returning the success value in a function that returns a value or
// an error.
//
// Example:
//
//  func DoSomething() (string, error) {
//    return flow.Ok("success")
//  }
func Ok[T any](value T) (T, error) {
	return value, nil
}
