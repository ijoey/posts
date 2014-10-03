function DateParser(date){
	var today = new Date();
	if(date === 'today'){
		today.setHours(0,0,0,0);
		return today;
	}
	if(date === 'tomorrow'){
		var tomorrow = today;
		tomorrow.setDate(today.getDate() + 1);
		return tomorrow;
	}
	if(date === 'next week'){
		var nextWeek = today;
		nextWeek.setDate(today.getDate() + 7);
		return nextWeek;
	}
	return Date.parse(date);
}
module.exports = DateParser;