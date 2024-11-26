// Covers all essential algorithms used in system (eg: sorting algorithms)
export default class Essential {

    // Gets value (being measured) from array
    // Called from QuickSort()
    static GetKeyIndexValue(item: any, keyIndexes: number[], i = 0): any {

        // Exit case once all keyIndexes have been used
        if (i == keyIndexes.length) { return item }

        // Update location of array as by  keyIndexes, then call for next keyIndex (recursive)
        item = item[keyIndexes[i]]
        return this.GetKeyIndexValue(item, keyIndexes, i + 1)
    }

    // QuickSort Algorithm O(n^2)
    static QuickSort(arr: any[], keyIndexes: number[]): any[] {
        
        // Exit case if array is empty or 1 value
        if (arr.length <= 1) {
            return arr;
        }

        // Initialise low and high arrays and pivot at end of array
        var low: number[] = []
        var high: number[] = []
        var pivot = arr.pop()

        // Get value of pivot to use in comparisons
        var pivotValue = this.GetKeyIndexValue(pivot, keyIndexes)

        // Compare each item's value to pivot value
        // Pushing to high and low arrays respectively
        arr.forEach((item) => {
            var value = this.GetKeyIndexValue(item, keyIndexes)
            if (value > pivotValue) {
                high.push(item);
            } else {
                low.push(item);
            }
        });
        
        // Construct final array, which is a concatenation of (in order):
        // The sorted "low" array (recursive)
        // The pivot
        // The sorted "high" array (recursive)
        var final = this.QuickSort(low, keyIndexes);
        final.push(pivot);
        final = final.concat(this.QuickSort(high, keyIndexes));

        // Returnsorted array
        return final
    }
}