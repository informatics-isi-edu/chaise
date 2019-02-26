#!/usr/bin/python
# -*- coding: utf-8 -*-
import os

failedTests = {}
def readDataFromFile(fileName):
    # open file as (r)ead-only and in (b)inary
    with open(fileName, 'rb') as dataFile:
        # failedTests = {}
        lines = dataFile.readlines()
        i = 0
        for line in lines:
            # character for failed test
            failure_text = '31mâœ—'
            if line.__contains__(failure_text):
                text_case = line.split(failure_text)[1].split('[39m')[0]

                if text_case in failedTests:
                    failedTests[text_case] = failedTests[text_case] + 1
                else:
                    failedTests[text_case] = 1

        dataFile.closed

def writeDataToFile(fileName):
    with open(fileName, 'wb') as output:
        # sort the list by season value
        for row in failedTests:
            output.write( row + '| ' + str(failedTests[row]) + '\n')

        output.closed

# for each file in folder:
for filename in os.listdir('failure-logs'):
    print filename
    readDataFromFile('failure-logs/' + filename)
writeDataToFile('failures.txt')
