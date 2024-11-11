// Covers all essential algorithms used in the system (eg: sorting algorithms)
export default class Essential {

    // Gets the value (being measured) from the array
    // Called from QuickSort()
    GetKeyIndexValue(item, keyIndexes, i = 0) {

        // Exit case once all keyIndexes have been used
        if (i == keyIndexes.length) { return item }

        // Update the location of the array as by the keyIndexes, then call for next keyIndex (recursive)
        item = item[keyIndexes[i]]
        return this.GetKeyIndexValue(item, keyIndexes, i + 1)
    }

    // QuickSort Algorithm O(n^2)
    QuickSort(arr, keyIndexes) {
        
        // Exit case if array is empty or 1 value
        if (arr.length <= 1) {
            return arr;
        }

        // Initialise low and high arrays and choose a random pivot
        var low = []
        var high = []
        var pivot = arr.pop(Math.round(Math.random() * (arr.length - 1)))

        // Get the value of the pivot to use in comparisons
        var pivotValue = this.GetKeyIndexValue(pivot, keyIndexes)

        // Compare each item's value to the pivot value
        // Pushing to high and low arrays respectively
        arr.forEach((item) => {
            var value = this.GetKeyIndexValue(item, keyIndexes)
            if (value > pivotValue) {
                high.push(item);
            } else {
                low.push(item);
            }
        });
        
        // Construct the final array, which is a concatenation of (in order):
        // The sorted "low" array (recursive)
        // The pivot
        // The sorted "high" array (recursive)
        var final = this.QuickSort(low, keyIndexes);
        final.push(pivot);
        final = final.concat(this.QuickSort(high, keyIndexes));

        // Return the sorted array
        return final
    }
}