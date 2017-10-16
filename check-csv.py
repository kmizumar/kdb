#!/usr/bin/env python
import argparse
import os
import sys


def check_csv(path, date):
    all_day = os.path.exists(path + '/stocks_' + date + '.csv')
    morning = os.path.exists(path + '/stocks_' + date + '_a.csv')
    afternoon = os.path.exists(path + '/stocks_' + date + '_b.csv')
    return all_day and morning and afternoon


def main(argv=None):
    if argv is None:
        argv = sys.argv[1:]

    parser = argparse.ArgumentParser(description='CSV existence checker')
    parser.add_argument('-d', '--directory',
                        metavar='directory',
                        required=True,
                        help='directory name where csv files are stored')
    parser.add_argument('-l', '--list-file',
                        metavar='list_file',
                        required=True,
                        help='list of dates to be checked')
    args = parser.parse_args(argv)

    with open(args.list_file) as input_file:
        for line in input_file:
            date = line.rstrip()
            if not check_csv(args.directory, date):
                print(line.rstrip())


if __name__ == "__main__":
    sys.exit(main())
