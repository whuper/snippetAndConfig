/**
 * 方法说明：冒泡排序
 * @param {Array} arr
 * @return {Array}
 */

	var num1 = 0;
	var num2 = 0;
	var num3 = 0;

function bubbleSort(arr) {

    var len = arr.length;
    console.time('改进前冒泡排序耗时');
    for (var i = 0; i < len; i++) {
        for (var j = 0; j < len - 1; j++) {
					num1+=1;
            if (arr[j] > arr[j + 1]) { //相邻元素两两对比
                var temp = arr[j + 1]; //元素交换
                arr[j + 1] = arr[j];
                arr[j] = temp;
            }
        }
    }
    console.timeEnd('改进前冒泡排序耗时');
    return arr;
}
//1.改进冒泡排序
function bubbleSort2(arr) {
    console.time('1.改进后冒泡排序耗时');
    var i = arr.length - 1; //初始时,最后位置保持不变
    while (i > 0) {
        var pos = 0; //每趟开始时,无记录交换
        for (var j = 0; j < i; j++) {
				
							
							num2+=1;
            if (arr[j] > arr[j + 1]) {
						
                pos = j; //记录交换的位置
                var tmp = arr[j];
                arr[j] = arr[j + 1];
                arr[j + 1] = tmp;
            }
					
			}
					i = pos; //为下一趟排序作准备
    }
    console.timeEnd('1.改进后冒泡排序耗时');
    return arr;
}
//2.改进冒泡排序
function bubbleSort3(arr3) {
    var low = 0;
    var high = arr.length - 1; //设置变量的初始值
    var tmp, j;
    console.time('2.改进后冒泡排序耗时');
    while (low < high) {
        for (j = low; j < high; ++j) //正向冒泡,找到最大者
            if (arr[j] > arr[j + 1]) {
                tmp = arr[j];
                arr[j] = arr[j + 1];
                arr[j + 1] = tmp;
            }
            --high; //修改high值, 前移一位
        for (j = high; j > low; --j) //反向冒泡,找到最小者
            if (arr[j] < arr[j - 1]) {
                tmp = arr[j];
                arr[j] = arr[j - 1];
                arr[j - 1] = tmp;
            }
            ++low; //修改low值,后移一位
    }
    console.timeEnd('2.改进后冒泡排序耗时');
    return arr3;
}
var arr = [3, 44, 38, 5, 47, 15, 36, 26, 27, 2, 46, 4, 19, 50, 48];
var arr2 = [6, 44, 38, 5, 47, 15, 36, 26, 27, 2, 46, 4, 19, 50, 48];
var arr3 = [7, 44, 38, 5, 47, 15, 36, 26, 27, 2, 46, 4, 19, 50, 48];
//console.log(selectionSort(arr)); 
console.log(bubbleSort(arr));
console.log(bubbleSort2(arr2));  

//console.log(bubbleSort3(arr)); 
console.log('###');
console.log('num1 ' + num1); //105 刚好是才C(15,2)的组合数 如果全部遍历的话,是A(15,2)排列数 (r=2时候,排列数是组合数的两倍)
console.log('共计算num2 ' + num2);
