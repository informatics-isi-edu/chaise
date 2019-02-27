#!/usr/bin/python
# -*- coding: utf-8 -*-
import os

def addToDict(dict, case):
    if case in dict:
        dict[case] = dict[case] + 1
    else:
        dict[case] = 1

def sortDictByFreq(dict):
    return sorted(dict.items(), key=lambda kv: kv[1], reverse=True)

###### MAIN STARTS HERE ######
failure_text = '31mâœ—'
pass_text = '32mâœ“'
endline = '[39m'
# setup control and count all tests for a failed run
allTests = {}
# open file as (r)ead-only and in (b)inary
with open('failure-logs/3746.txt', 'rb') as dataFile:
    lines = dataFile.readlines()
    # look for pass/fail text on each line and strip the content from that text and the endline character
    for line in lines:
        if line.__contains__(failure_text):
            text_case = line.split(failure_text)[1].split(endline)[0]

            addToDict(allTests, text_case)

        if line.__contains__(pass_text):
            text_case = line.split(pass_text)[1].split(endline)[0]

            addToDict(allTests, text_case)

    dataFile.closed
# no need to write out the control list
# writeDataToFile('all.txt', sortDictByFreq(allTests))

failedTests = {}
files_read = 0
# for each file in folder:
for filename in os.listdir('error-failure-logs'):
    with open('error-failure-logs/' + filename, 'rb') as dataFile:
        lines = dataFile.readlines()
        for line in lines:
            if line.__contains__(failure_text):
                text_case = line.split(failure_text)[1].split(endline)[0]

                addToDict(failedTests, text_case)

        files_read = files_read + 1
        dataFile.closed

failedTestsTuples = []
# calculate the failure rate before sorting content for output
for row in failedTests:
    test_case = row
    occurrences = failedTests[row]
    perbuild = str(allTests[test_case]) + ' (' + str(allTests[test_case] * files_read) + ')'
    rate = round(float(occurrences)/float(allTests[test_case] * files_read) * 100, 2)
    failedTestsTuples.append( (test_case, occurrences, perbuild, rate) )

with open('error-failures.txt', 'wb') as output:
    # sort the list by "failure rate"
    for row in sorted(failedTestsTuples, key=lambda kv: kv[3], reverse=True):
        output.write( row[0] + '| ' + str(row[1]) + '| ' + str(row[2]) + '| ' + str(row[3]) + '%\n')

    output.closed
